package com.intelligentfarm.auth;

import java.time.Clock;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AccountRepository accountRepository;
    private final SessionRepository sessionRepository;
    private final SessionTokenService tokenService;
    private final PasswordEncoder passwordEncoder;
    private final AuthProperties properties;
    private final Clock clock;

    public AuthService(
            AccountRepository accountRepository,
            SessionRepository sessionRepository,
            SessionTokenService tokenService,
            PasswordEncoder passwordEncoder,
            AuthProperties properties,
            Clock clock) {
        this.accountRepository = Objects.requireNonNull(accountRepository, "accountRepository");
        this.sessionRepository = Objects.requireNonNull(sessionRepository, "sessionRepository");
        this.tokenService = Objects.requireNonNull(tokenService, "tokenService");
        this.passwordEncoder = Objects.requireNonNull(passwordEncoder, "passwordEncoder");
        this.properties = Objects.requireNonNull(properties, "properties");
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    @Transactional
    public SessionGrant register(String emailValue, String password, String presentedSessionToken) {
        String email = normalizeEmail(emailValue);
        validatePassword(password);
        if (accountRepository.findByEmail(email).isPresent()) {
            throw new ConflictException("An account with this email already exists.");
        }

        Instant now = Instant.now(clock);
        Account account = Account.create(email, passwordEncoder.encode(password), now);
        if (!accountRepository.createIfAbsent(account)) {
            throw new ConflictException("An account with this email already exists.");
        }
        revokePresentedSession(presentedSessionToken, now);
        return createAuthenticatedSession(account, now);
    }

    @Transactional
    public SessionGrant login(String emailValue, String password, String presentedSessionToken) {
        String email = normalizeEmail(emailValue);
        if (password == null || password.isBlank() || password.codePointCount(0, password.length()) > 1024) {
            throw new UnauthorizedException();
        }
        Account account = accountRepository.findByEmail(email)
                .filter(candidate -> passwordEncoder.matches(password, candidate.getPasswordHash()))
                .orElseThrow(UnauthorizedException::new);
        Instant now = Instant.now(clock);
        revokePresentedSession(presentedSessionToken, now);
        return createAuthenticatedSession(account, now);
    }

    @Transactional
    public SessionGrant bootstrapCsrf(String presentedToken) {
        Instant now = Instant.now(clock);
        Optional<Session> existing = findValidSession(presentedToken, now);
        String csrfToken = tokenService.generateToken();

        if (existing.isPresent()) {
            Session session = existing.get();
            if (sessionRepository.updateCsrfTokenHash(
                    session.getId(), tokenService.hashToken(csrfToken))) {
                return new SessionGrant(presentedToken, csrfToken, session.getAbsoluteExpiresAt());
            }
        }

        String sessionToken = tokenService.generateToken();
        Instant expiresAt = now.plus(properties.getPreAuthTimeout());
        Session session = new Session(
                UUID.randomUUID(),
                SessionKind.PRE_AUTH,
                tokenService.hashToken(sessionToken),
                tokenService.hashToken(csrfToken),
                now,
                now,
                expiresAt,
                null,
                null,
                null);
        sessionRepository.save(session);
        return new SessionGrant(sessionToken, csrfToken, expiresAt);
    }

    @Transactional
    public Optional<SessionIdentity> validateSession(String presentedToken) {
        Instant now = Instant.now(clock);
        Optional<Session> valid = findValidSession(presentedToken, now);
        if (valid.isEmpty()) return Optional.empty();

        Session session = valid.get();
        if (!sessionRepository.updateLastActivity(session.getId(), now)) return Optional.empty();
        if (session.getKind() == SessionKind.PRE_AUTH) {
            return Optional.empty();
        }
        return accountRepository.findById(session.getAccountId())
                .map(account -> new SessionIdentity(account.getEmail(), session.getAbsoluteExpiresAt()));
    }

    @Transactional
    public boolean isCsrfValid(String presentedToken, String csrfToken) {
        if (csrfToken == null || csrfToken.isBlank()) return false;
        return findValidSession(presentedToken, Instant.now(clock))
                .map(session -> tokenService.matches(csrfToken, session.getCsrfTokenHash()))
                .orElse(false);
    }

    @Transactional
    public void logout(String presentedToken) {
        findValidSession(presentedToken, Instant.now(clock))
                .ifPresent(session -> sessionRepository.revoke(session.getId(), Instant.now(clock)));
    }

    private void revokePresentedSession(String presentedToken, Instant now) {
        if (presentedToken == null || presentedToken.isBlank()) return;
        sessionRepository.findByTokenHash(tokenService.hashToken(presentedToken))
                .ifPresent(session -> sessionRepository.revoke(session.getId(), now));
    }

    private SessionGrant createAuthenticatedSession(Account account, Instant now) {
        String sessionToken = tokenService.generateToken();
        String csrfToken = tokenService.generateToken();
        Instant expiresAt = now.plus(properties.getAbsoluteTimeout());
        Session session = new Session(
                UUID.randomUUID(),
                SessionKind.AUTHENTICATED,
                tokenService.hashToken(sessionToken),
                tokenService.hashToken(csrfToken),
                now,
                now,
                expiresAt,
                null,
                account.getId(),
                account.getAuthVersion());
        sessionRepository.save(session);
        return new SessionGrant(sessionToken, csrfToken, expiresAt);
    }

    private Optional<Session> findValidSession(String presentedToken, Instant now) {
        if (presentedToken == null || presentedToken.isBlank()) return Optional.empty();
        Optional<Session> found = sessionRepository.findByTokenHash(tokenService.hashToken(presentedToken));
        if (found.isEmpty()) return Optional.empty();
        Session session = found.get();
        Instant idleExpiry = session.getLastActivityAt().plus(properties.getIdleTimeout());
        boolean expired = session.getRevokedAt() != null
                || !session.getAbsoluteExpiresAt().isAfter(now)
                || !idleExpiry.isAfter(now);
        if (expired) {
            sessionRepository.revoke(session.getId(), now);
            return Optional.empty();
        }
        if (session.getKind() == SessionKind.AUTHENTICATED) {
            Optional<Account> account = accountRepository.findById(session.getAccountId());
            if (account.isEmpty() || account.get().getAuthVersion() != session.getAuthVersion()) {
                sessionRepository.revoke(session.getId(), now);
                return Optional.empty();
            }
        }
        return Optional.of(session);
    }

    private static String normalizeEmail(String emailValue) {
        try {
            return Account.normalizeEmail(emailValue);
        } catch (NullPointerException | IllegalArgumentException exception) {
            throw new ValidationException("Enter a valid email address.");
        }
    }

    private static void validatePassword(String password) {
        if (password == null) throw new ValidationException("Password is required.");
        int characters = password.codePointCount(0, password.length());
        if (characters < 8 || characters > 1024) {
            throw new ValidationException("Password must be between 8 and 1024 characters.");
        }
        boolean letter = password.codePoints().anyMatch(Character::isLetter);
        boolean digit = password.codePoints().anyMatch(Character::isDigit);
        boolean special = password.codePoints().anyMatch(codePoint ->
                !Character.isLetterOrDigit(codePoint) && !Character.isWhitespace(codePoint));
        if (!letter || !digit || !special) {
            throw new ValidationException("Password must include a letter, a number, and a special symbol.");
        }
    }

    public record SessionGrant(String sessionToken, String csrfToken, Instant expiresAt) {
    }

    public record SessionIdentity(String email, Instant expiresAt) {
    }

    public static class ValidationException extends RuntimeException {
        public ValidationException(String message) { super(message); }
    }

    public static class ConflictException extends RuntimeException {
        public ConflictException(String message) { super(message); }
    }

    public static class UnauthorizedException extends RuntimeException {
        public UnauthorizedException() { super("Invalid email or password."); }
    }
}

package com.intelligentfarm.auth;

import java.time.Clock;
import java.time.Instant;
import java.util.Objects;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordResetService {

    private final AccountRepository accountRepository;
    private final AuthActionTokenService tokenService;
    private final AuthEmailSender emailSender;
    private final AuthProperties properties;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public PasswordResetService(
            AccountRepository accountRepository,
            AuthActionTokenService tokenService,
            AuthEmailSender emailSender,
            AuthProperties properties,
            PasswordEncoder passwordEncoder,
            Clock clock) {
        this.accountRepository = Objects.requireNonNull(accountRepository, "accountRepository");
        this.tokenService = Objects.requireNonNull(tokenService, "tokenService");
        this.emailSender = Objects.requireNonNull(emailSender, "emailSender");
        this.properties = Objects.requireNonNull(properties, "properties");
        this.passwordEncoder = Objects.requireNonNull(passwordEncoder, "passwordEncoder");
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    @Transactional
    public void requestReset(String email) {
        Account account = accountRepository.findByEmail(Account.normalizeEmail(email))
                .filter(Account::isEligibleForAuthentication)
                .orElse(null);
        if (account == null) {
            return;
        }
        String rawToken = tokenService.issue(
                account.getId(),
                AuthActionType.PASSWORD_RESET,
                properties.getPasswordResetTokenTimeout());
        emailSender.sendPasswordReset(account.getEmail(), account.getFullName(), rawToken);
    }

    @Transactional
    public boolean resetPassword(String rawToken, String newPassword) {
        PasswordPolicy.validate(newPassword);
        var token = tokenService.consume(rawToken, AuthActionType.PASSWORD_RESET);
        if (token.isEmpty()) {
            return false;
        }
        Instant updatedAt = Instant.now(clock);
        boolean updated = accountRepository.updatePasswordHashAndIncrementAuthVersion(
                token.get().accountId(), passwordEncoder.encode(newPassword), updatedAt);
        if (!updated) {
            throw new IllegalStateException("Password reset account no longer exists.");
        }
        return true;
    }
}

package com.intelligentfarm.auth;

import java.time.Clock;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailVerificationService {

    private final AccountRepository accountRepository;
    private final AuthActionTokenService tokenService;
    private final AuthEmailSender emailSender;
    private final AuthProperties properties;
    private final Clock clock;

    public EmailVerificationService(
            AccountRepository accountRepository,
            AuthActionTokenService tokenService,
            AuthEmailSender emailSender,
            AuthProperties properties,
            Clock clock) {
        this.accountRepository = Objects.requireNonNull(accountRepository, "accountRepository");
        this.tokenService = Objects.requireNonNull(tokenService, "tokenService");
        this.emailSender = Objects.requireNonNull(emailSender, "emailSender");
        this.properties = Objects.requireNonNull(properties, "properties");
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    @Transactional
    public void sendVerification(Account account) {
        String rawToken = tokenService.issue(
                account.getId(),
                AuthActionType.EMAIL_VERIFICATION,
                properties.getEmail().getVerificationTokenTimeout());
        emailSender.sendVerification(account.getEmail(), account.getFullName(), rawToken);
    }

    @Transactional
    public boolean verify(String rawToken) {
        return tokenService.consume(rawToken, AuthActionType.EMAIL_VERIFICATION)
                .map(token -> accountRepository.markEmailVerified(token.accountId(), Instant.now(clock)))
                .orElse(false);
    }

    @Transactional
    public void resend(String email) {
        Optional<Account> account = accountRepository.findByEmail(Account.normalizeEmail(email))
                .filter(candidate -> candidate.getStatus() == AccountStatus.PENDING_VERIFICATION);
        account.ifPresent(this::sendVerification);
    }

    public String deliveryMode() {
        return emailSender.mode();
    }
}

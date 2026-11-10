package com.intelligentfarm.auth;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class EmailVerificationServiceTest {

    private AccountRepository accountRepository;
    private AuthActionTokenService tokenService;
    private EmailVerificationService verificationService;
    private UUID accountId;
    private Instant now;

    @BeforeEach
    void setUp() {
        accountRepository = mock(AccountRepository.class);
        tokenService = mock(AuthActionTokenService.class);
        now = Instant.parse("2026-01-02T03:04:05Z");
        accountId = UUID.randomUUID();
        verificationService = new EmailVerificationService(
                accountRepository,
                tokenService,
                mock(AuthEmailSender.class),
                new AuthProperties(),
                Clock.fixed(now, ZoneOffset.UTC));
    }

    @Test
    void verifiesTheAccountOnlyAfterConsumingAValidVerificationToken() {
        when(tokenService.consume("verification-token", AuthActionType.EMAIL_VERIFICATION))
                .thenReturn(Optional.of(token(AuthActionType.EMAIL_VERIFICATION)));
        when(accountRepository.markEmailVerified(accountId, now)).thenReturn(true);

        assertTrue(verificationService.verify("verification-token"));

        verify(accountRepository).markEmailVerified(accountId, now);
    }

    @Test
    void invalidTokenDoesNotModifyAnAccount() {
        when(tokenService.consume("expired-token", AuthActionType.EMAIL_VERIFICATION))
                .thenReturn(Optional.empty());

        assertFalse(verificationService.verify("expired-token"));

        verify(accountRepository, never()).markEmailVerified(eq(accountId), eq(now));
    }

    private AuthActionToken token(AuthActionType type) {
        return new AuthActionToken(
                UUID.randomUUID(),
                accountId,
                type,
                "token-hash",
                now.minusSeconds(1),
                now.plusSeconds(60),
                null);
    }
}

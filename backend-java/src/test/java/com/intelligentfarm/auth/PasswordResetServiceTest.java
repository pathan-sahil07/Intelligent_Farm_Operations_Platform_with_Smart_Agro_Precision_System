package com.intelligentfarm.auth;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
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
import org.springframework.security.crypto.password.PasswordEncoder;

class PasswordResetServiceTest {

    private AccountRepository accountRepository;
    private AuthActionTokenService tokenService;
    private PasswordEncoder passwordEncoder;
    private PasswordResetService resetService;
    private UUID accountId;
    private Instant now;

    @BeforeEach
    void setUp() {
        accountRepository = mock(AccountRepository.class);
        tokenService = mock(AuthActionTokenService.class);
        passwordEncoder = mock(PasswordEncoder.class);
        now = Instant.parse("2026-01-02T03:04:05Z");
        accountId = UUID.randomUUID();
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-new-password");
        resetService = new PasswordResetService(
                accountRepository,
                tokenService,
                mock(AuthEmailSender.class),
                new AuthProperties(),
                passwordEncoder,
                Clock.fixed(now, ZoneOffset.UTC));
    }

    @Test
    void resetConsumesTokenAndIncrementsAccountAuthVersionThroughRepository() {
        when(tokenService.consume("reset-token", AuthActionType.PASSWORD_RESET))
                .thenReturn(Optional.of(new AuthActionToken(
                        UUID.randomUUID(),
                        accountId,
                        AuthActionType.PASSWORD_RESET,
                        "token-hash",
                        now.minusSeconds(1),
                        now.plusSeconds(60),
                        null)));
        when(accountRepository.updatePasswordHashAndIncrementAuthVersion(
                accountId, "encoded-new-password", now)).thenReturn(true);

        assertTrue(resetService.resetPassword("reset-token", "AValidPassword!123"));

        verify(accountRepository).updatePasswordHashAndIncrementAuthVersion(
                accountId, "encoded-new-password", now);
    }

    @Test
    void invalidResetTokenDoesNotChangeThePassword() {
        when(tokenService.consume("expired-token", AuthActionType.PASSWORD_RESET))
                .thenReturn(Optional.empty());

        assertFalse(resetService.resetPassword("expired-token", "AValidPassword!123"));

        verify(accountRepository, never())
                .updatePasswordHashAndIncrementAuthVersion(eq(accountId), anyString(), eq(now));
    }
}

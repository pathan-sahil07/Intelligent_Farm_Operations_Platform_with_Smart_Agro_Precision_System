package com.intelligentfarm.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class AuthActionTokenServiceTest {

    private AuthActionTokenRepository repository;
    private AuthActionTokenService tokenService;
    private Instant now;

    @BeforeEach
    void setUp() {
        repository = mock(AuthActionTokenRepository.class);
        now = Instant.parse("2026-01-02T03:04:05Z");
        tokenService = new AuthActionTokenService(
                repository, new SessionTokenService(), Clock.fixed(now, ZoneOffset.UTC));
    }

    @Test
    void issueStoresOnlyHashAndInvalidatesEarlierTokensOfTheSamePurpose() {
        UUID accountId = UUID.randomUUID();

        String rawToken =
                tokenService.issue(accountId, AuthActionType.PASSWORD_RESET, Duration.ofMinutes(30));

        ArgumentCaptor<AuthActionToken> captor = ArgumentCaptor.forClass(AuthActionToken.class);
        verify(repository).invalidateOpenTokens(accountId, AuthActionType.PASSWORD_RESET, now);
        verify(repository).save(captor.capture());
        AuthActionToken saved = captor.getValue();
        assertNotEquals(rawToken, saved.tokenHash());
        assertEquals(now.plus(Duration.ofMinutes(30)), saved.expiresAt());
        assertEquals(AuthActionType.PASSWORD_RESET, saved.type());
    }

    @Test
    void expiredTokenIsNotConsumed() {
        UUID tokenId = UUID.randomUUID();
        AuthActionToken expired = new AuthActionToken(
                tokenId,
                UUID.randomUUID(),
                AuthActionType.EMAIL_VERIFICATION,
                "hash",
                now.minus(Duration.ofHours(2)),
                now.minus(Duration.ofHours(1)),
                null);
        when(repository.findUsableByHashForUpdate(
                        any(), eq(AuthActionType.EMAIL_VERIFICATION), eq(now)))
                .thenReturn(Optional.of(expired));

        assertTrue(tokenService.consume("expired", AuthActionType.EMAIL_VERIFICATION).isEmpty());

        verify(repository, never()).consume(tokenId, now);
    }

    @Test
    void validTokenIsReturnedOnlyAfterAtomicConsumptionSucceeds() {
        AuthActionToken valid = new AuthActionToken(
                UUID.randomUUID(),
                UUID.randomUUID(),
                AuthActionType.EMAIL_VERIFICATION,
                "hash",
                now.minusSeconds(1),
                now.plusSeconds(60),
                null);
        when(repository.findUsableByHashForUpdate(
                        any(), eq(AuthActionType.EMAIL_VERIFICATION), eq(now)))
                .thenReturn(Optional.of(valid));
        when(repository.consume(valid.id(), now)).thenReturn(true);

        Optional<AuthActionToken> consumed =
                tokenService.consume("valid", AuthActionType.EMAIL_VERIFICATION);

        assertTrue(consumed.isPresent());
        assertEquals(valid.id(), consumed.orElseThrow().id());
    }

    @Test
    void tokenCannotBeReturnedWhenAtomicConsumptionFails() {
        AuthActionToken valid = new AuthActionToken(
                UUID.randomUUID(),
                UUID.randomUUID(),
                AuthActionType.EMAIL_VERIFICATION,
                "hash",
                now.minusSeconds(1),
                now.plusSeconds(60),
                null);
        when(repository.findUsableByHashForUpdate(
                        any(), eq(AuthActionType.EMAIL_VERIFICATION), eq(now)))
                .thenReturn(Optional.of(valid));

        assertFalse(tokenService.consume("valid", AuthActionType.EMAIL_VERIFICATION).isPresent());
    }
}

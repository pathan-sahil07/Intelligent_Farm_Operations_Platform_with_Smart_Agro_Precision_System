package com.intelligentfarm.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {

    private AccountRepository accountRepository;
    private SessionRepository sessionRepository;
    private PasswordEncoder passwordEncoder;
    private EmailVerificationService emailVerificationService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        accountRepository = mock(AccountRepository.class);
        sessionRepository = mock(SessionRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        emailVerificationService = mock(EmailVerificationService.class);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-hash");
        authService = new AuthService(
                accountRepository,
                sessionRepository,
                new SessionTokenService(),
                passwordEncoder,
                new AuthProperties(),
                emailVerificationService,
                Clock.fixed(Instant.parse("2026-01-02T03:04:05Z"), ZoneOffset.UTC));
    }

    @Test
    void registrationCreatesActiveOwnerAndIssuesSession() {
        when(accountRepository.findByEmail("owner@example.test")).thenReturn(Optional.empty());
        when(accountRepository.createIfAbsent(any(Account.class))).thenReturn(true);

        AuthService.SessionGrant grant = authService.register(
                " OWNER@example.test ",
                "GoodPassword!123",
                "Farm Owner",
                "+15555550123",
                null);

        assertNotNull(grant);
        assertEquals("owner@example.test", grant.identity().email());
        assertEquals(FarmRole.FARM_OWNER, grant.identity().role());
        verify(sessionRepository).save(any(Session.class));
    }

    @Test
    void loginRejectsUnverifiedAccountEvenWhenPasswordMatches() {
        Account pending = Account.createPendingOwner(
                "owner@example.test",
                "encoded-hash",
                "Farm Owner",
                "+15555550123",
                Instant.parse("2026-01-02T03:04:05Z"));
        when(accountRepository.findByEmail("owner@example.test")).thenReturn(Optional.of(pending));
        when(passwordEncoder.matches("GoodPassword!123", "encoded-hash")).thenReturn(true);

        assertThrows(
                AuthService.UnverifiedAccountException.class,
                () -> authService.login("owner@example.test", "GoodPassword!123", null));
        verify(sessionRepository, never()).save(any(Session.class));
    }

    @Test
    void loginCreatesSessionWithServerAssignedRole() {
        Account owner = Account.createVerifiedMember(
                "owner@example.test",
                "encoded-hash",
                "Farm Owner",
                "+15555550123",
                FarmRole.FARM_OWNER,
                Instant.parse("2026-01-02T03:04:05Z"));
        when(accountRepository.findByEmail("owner@example.test")).thenReturn(Optional.of(owner));
        when(passwordEncoder.matches("GoodPassword!123", "encoded-hash")).thenReturn(true);

        AuthService.SessionGrant grant =
                authService.login("owner@example.test", "GoodPassword!123", null);

        assertEquals(FarmRole.FARM_OWNER, grant.identity().role());
        assertEquals("owner@example.test", grant.identity().email());
        verify(sessionRepository).save(any(Session.class));
    }
}

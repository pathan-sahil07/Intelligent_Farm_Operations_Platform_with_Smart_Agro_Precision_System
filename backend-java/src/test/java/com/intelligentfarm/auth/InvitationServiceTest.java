package com.intelligentfarm.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

class InvitationServiceTest {

    private InvitationRepository invitationRepository;
    private AccountRepository accountRepository;
    private SessionTokenService tokenService;
    private AuthEmailSender emailSender;
    private PasswordEncoder passwordEncoder;
    private InvitationService invitationService;
    private AuthPrincipal owner;

    @BeforeEach
    void setUp() {
        invitationRepository = mock(InvitationRepository.class);
        accountRepository = mock(AccountRepository.class);
        tokenService = mock(SessionTokenService.class);
        emailSender = mock(AuthEmailSender.class);
        passwordEncoder = mock(PasswordEncoder.class);
        when(tokenService.generateToken()).thenReturn("opaque-token");
        when(tokenService.hashToken(anyString())).thenReturn("hashed-token");
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-password");
        invitationService = new InvitationService(
                invitationRepository,
                accountRepository,
                tokenService,
                emailSender,
                new AuthProperties(),
                passwordEncoder,
                Clock.fixed(Instant.parse("2026-01-02T03:04:05Z"), ZoneOffset.UTC));
        owner = new AuthPrincipal(
                UUID.randomUUID(), "owner@example.test", "Owner", FarmRole.FARM_OWNER);
    }

    @Test
    void createsInvitationWithAuthorizedRoleAndUnavailableAssignments() {
        Invitation invitation = invitationService.create(
                owner,
                new InvitationDtos.CreateRequest(
                        "manager@example.test",
                        "Farm Manager",
                        FarmRole.FARM_MANAGER,
                        List.of(),
                        null,
                        null));

        assertEquals(InvitationStatus.PENDING, invitation.status());
        assertEquals("manager@example.test", invitation.email());
        verify(invitationRepository).save(any(Invitation.class));
        verify(emailSender).sendInvitation(
                "manager@example.test", "Farm Manager", "opaque-token", FarmRole.FARM_MANAGER);
    }

    @Test
    void rejectsRequestedFarmAssignmentsInsteadOfDroppingThem() {
        InvitationService.InvitationException exception = assertThrows(
                InvitationService.InvitationException.class,
                () -> invitationService.create(
                        owner,
                        new InvitationDtos.CreateRequest(
                                "manager@example.test",
                                "Farm Manager",
                                FarmRole.FARM_MANAGER,
                                List.of(UUID.randomUUID()),
                                null,
                                null)));

        assertEquals("assignment_source_unavailable", exception.getCode());
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, exception.getStatus());
        verify(invitationRepository, never()).save(any(Invitation.class));
    }

    @Test
    void rejectsInvitationRoleChosenByClientWhenItDiffersFromToken() {
        UUID invitationId = UUID.randomUUID();
        Invitation invitation = new Invitation(
                invitationId,
                "manager@example.test",
                "Farm Manager",
                FarmRole.FARM_MANAGER,
                InvitationStatus.PENDING,
                "hashed-token",
                owner.accountId(),
                Instant.parse("2026-01-02T03:04:05Z"),
                Instant.parse("2026-01-09T03:04:05Z"),
                null,
                null,
                null);
        when(invitationRepository.findByTokenHashForUpdate("hashed-token"))
                .thenReturn(Optional.of(invitation));

        InvitationService.InvitationException exception = assertThrows(
                InvitationService.InvitationException.class,
                () -> invitationService.accept(
                        new InvitationDtos.AcceptRequest(
                                "opaque-token",
                                "Farm Manager",
                                FarmRole.FARM_OWNER,
                                "GoodPassword!123",
                                "+15555550123"),
                        null));

        assertEquals("invitation_role_mismatch", exception.getCode());
        verify(accountRepository, never()).createIfAbsent(any(Account.class));
    }

    @Test
    void acceptsInvitationsWithoutOrganizationOrFarmAssignments() {
        Invitation invitation = new Invitation(
                UUID.randomUUID(),
                "manager@example.test",
                "Farm Manager",
                FarmRole.FARM_MANAGER,
                InvitationStatus.PENDING,
                "hashed-token",
                owner.accountId(),
                Instant.parse("2026-01-02T03:04:05Z"),
                Instant.parse("2026-01-09T03:04:05Z"),
                null,
                null,
                null);
        when(invitationRepository.findByTokenHashForUpdate("hashed-token"))
                .thenReturn(Optional.of(invitation));
        when(accountRepository.findByEmail("manager@example.test")).thenReturn(Optional.empty());
        when(accountRepository.createIfAbsent(any(Account.class))).thenReturn(true);
        when(invitationRepository.accept(any(UUID.class), any(UUID.class), any(Instant.class)))
                .thenReturn(true);

        InvitationService.AcceptResult result = invitationService.accept(
                new InvitationDtos.AcceptRequest(
                        "opaque-token",
                        "Farm Manager",
                        FarmRole.FARM_MANAGER,
                        "GoodPassword!123",
                        "+15555550123"),
                null);

        assertEquals(true, result.accountCreated());
        assertEquals(FarmRole.FARM_MANAGER, result.account().getRole());
        assertEquals(AccountStatus.ACTIVE, result.account().getStatus());
    }
}

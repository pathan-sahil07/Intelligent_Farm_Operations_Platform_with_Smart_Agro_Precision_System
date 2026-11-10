package com.intelligentfarm.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

class InvitationControllerTest {

    @Test
    void acceptingInvitationForExistingAccountRefreshesSessionAndCsrfToken() {
        InvitationService invitationService = mock(InvitationService.class);
        AuthService authService = mock(AuthService.class);
        AuthProperties properties = new AuthProperties();
        InvitationController controller =
                new InvitationController(invitationService, authService, properties);
        AuthPrincipal principal = new AuthPrincipal(
                UUID.randomUUID(), "farmer@example.test", "Farmer", FarmRole.FARMER);
        var authentication = UsernamePasswordAuthenticationToken.authenticated(
                principal, null, RolePolicy.authoritiesFor(principal.role()));
        var request = new InvitationDtos.AcceptRequest(
                "invitation-token", "Farmer", FarmRole.FARMER, null, null);
        Account account = Account.createVerifiedMember(
                principal.email(),
                "encoded-password",
                principal.fullName(),
                null,
                principal.role(),
                Instant.parse("2026-01-02T03:04:05Z"));
        when(invitationService.accept(request, principal))
                .thenReturn(new InvitationService.AcceptResult(account, false));
        Instant expiresAt = Instant.parse("2026-01-02T04:04:05Z");
        when(authService.authenticateAccount(eq(account.getId()), any()))
                .thenReturn(new AuthService.SessionGrant(
                        "new-session-token",
                        "new-csrf-token",
                        expiresAt,
                        new AuthService.SessionIdentity(
                                account.getId(),
                                account.getEmail(),
                                account.getFullName(),
                                account.getRole(),
                                expiresAt)));
        HttpServletRequest servletRequest = mock(HttpServletRequest.class);

        var response = controller.accept(request, authentication, servletRequest);

        assertEquals("new-csrf-token", response.getBody().csrfToken());
        assertNotNull(response.getHeaders().getFirst(HttpHeaders.SET_COOKIE));
        verify(authService).authenticateAccount(eq(account.getId()), any());
    }
}

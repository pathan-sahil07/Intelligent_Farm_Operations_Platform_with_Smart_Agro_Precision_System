package com.intelligentfarm.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    private final InvitationService invitationService;
    private final AuthService authService;
    private final AuthProperties properties;

    public InvitationController(
            InvitationService invitationService, AuthService authService, AuthProperties properties) {
        this.invitationService = invitationService;
        this.authService = authService;
        this.properties = properties;
    }

    @GetMapping("/verify")
    public InvitationDtos.Preview verify(@RequestParam String token) {
        return invitationService.verify(token);
    }

    @GetMapping
    public List<InvitationDtos.Response> list(Authentication authentication) {
        return invitationService.list(requirePrincipal(authentication)).stream()
                .map(InvitationDtos::response)
                .toList();
    }

    @PostMapping
    public ResponseEntity<InvitationDtos.Response> create(
            Authentication authentication,
            @Valid @RequestBody InvitationDtos.CreateRequest request) {
        Invitation invitation = invitationService.create(requirePrincipal(authentication), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(InvitationDtos.response(invitation));
    }

    @PostMapping("/{id}/resend")
    public InvitationDtos.Response resend(
            Authentication authentication, @PathVariable UUID id) {
        return InvitationDtos.response(
                invitationService.resend(requirePrincipal(authentication), id));
    }

    @PostMapping("/{id}/revoke")
    public ResponseEntity<Void> revoke(Authentication authentication, @PathVariable UUID id) {
        invitationService.revoke(requirePrincipal(authentication), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/accept")
    public ResponseEntity<InvitationDtos.AcceptResponse> accept(
            @Valid @RequestBody InvitationDtos.AcceptRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {
        AuthPrincipal principal = authentication != null
                && authentication.getPrincipal() instanceof AuthPrincipal current
                        ? current
                        : null;
        InvitationService.AcceptResult result = invitationService.accept(request, principal);
        AuthService.SessionGrant grant = authService.authenticateAccount(
                result.account().getId(), readSessionCookie(servletRequest));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, sessionCookie(grant.sessionToken(), grant.expiresAt()).toString())
                .body(new InvitationDtos.AcceptResponse(
                        true, result.account().getEmail(), grant.csrfToken()));
    }

    private static AuthPrincipal requirePrincipal(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            throw new InvitationService.InvitationException(
                    HttpStatus.UNAUTHORIZED, "authentication_required", "Sign in to manage invitations.");
        }
        return principal;
    }

    private String readSessionCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        String cookieName = properties.getCookie().getName();
        for (var cookie : request.getCookies()) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private ResponseCookie sessionCookie(String token, Instant expiresAt) {
        Duration maxAge = Duration.between(Instant.now(), expiresAt);
        AuthProperties.Cookie policy = properties.getCookie();
        return ResponseCookie.from(policy.getName(), token)
                .httpOnly(true)
                .secure(policy.isSecure())
                .sameSite(policy.getSameSite())
                .path(policy.getPath())
                .maxAge(maxAge.isNegative() ? Duration.ZERO : maxAge)
                .build();
    }
}

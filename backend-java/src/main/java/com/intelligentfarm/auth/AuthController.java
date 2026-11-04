package com.intelligentfarm.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthProperties properties;

    public AuthController(AuthService authService, AuthProperties properties) {
        this.authService = authService;
        this.properties = properties;
    }

    @GetMapping("/csrf")
    public ResponseEntity<AuthDtos.CsrfResponse> csrf(HttpServletRequest request) {
        AuthService.SessionGrant grant = authService.bootstrapCsrf(readSessionCookie(request));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, sessionCookie(grant.sessionToken(), grant.expiresAt()).toString())
                .body(new AuthDtos.CsrfResponse(grant.csrfToken()));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDtos.AuthResponse> register(
            @Valid @RequestBody AuthDtos.RegistrationRequest body,
            HttpServletRequest request) {
        AuthService.SessionGrant grant = authService.register(
                body.email(), body.password(), readSessionCookie(request));
        return authenticated(grant, body.email(), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDtos.AuthResponse> login(
            @Valid @RequestBody AuthDtos.LoginRequest body,
            HttpServletRequest request) {
        AuthService.SessionGrant grant = authService.login(
                body.email(), body.password(), readSessionCookie(request));
        return authenticated(grant, body.email(), HttpStatus.OK);
    }

    @GetMapping("/session")
    public ResponseEntity<AuthDtos.AuthResponse> session(HttpServletRequest request) {
        Optional<AuthService.SessionIdentity> identity = authService.validateSession(readSessionCookie(request));
        if (identity.isEmpty()) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, clearCookie().toString())
                    .body(new AuthDtos.AuthResponse(false, null, null));
        }
        return ResponseEntity.ok(new AuthDtos.AuthResponse(true, identity.get().email(), null));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        authService.logout(readSessionCookie(request));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearCookie().toString())
                .build();
    }

    private ResponseEntity<AuthDtos.AuthResponse> authenticated(
            AuthService.SessionGrant grant, String email, HttpStatus status) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, sessionCookie(grant.sessionToken(), grant.expiresAt()).toString())
                .body(new AuthDtos.AuthResponse(true, email.trim().toLowerCase(java.util.Locale.ROOT), grant.csrfToken()));
    }

    private String readSessionCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        String name = properties.getCookie().getName();
        for (var cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) return cookie.getValue();
        }
        return null;
    }

    private ResponseCookie sessionCookie(String token, Instant expiresAt) {
        Duration maxAge = Duration.between(Instant.now(), expiresAt);
        if (maxAge.isNegative() || maxAge.isZero()) maxAge = Duration.ZERO;
        AuthProperties.Cookie policy = properties.getCookie();
        return ResponseCookie.from(policy.getName(), token)
                .httpOnly(true)
                .secure(policy.isSecure())
                .sameSite(policy.getSameSite())
                .path(policy.getPath())
                .maxAge(maxAge)
                .build();
    }

    private ResponseCookie clearCookie() {
        AuthProperties.Cookie policy = properties.getCookie();
        return ResponseCookie.from(policy.getName(), "")
                .httpOnly(true)
                .secure(policy.isSecure())
                .sameSite(policy.getSameSite())
                .path(policy.getPath())
                .maxAge(Duration.ZERO)
                .build();
    }
}

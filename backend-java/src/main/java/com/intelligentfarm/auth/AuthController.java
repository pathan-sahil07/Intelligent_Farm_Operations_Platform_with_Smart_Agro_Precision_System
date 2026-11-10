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
    private final EmailVerificationService emailVerificationService;
    private final PasswordResetService passwordResetService;
    private final AuthProperties properties;

    public AuthController(
            AuthService authService,
            EmailVerificationService emailVerificationService,
            PasswordResetService passwordResetService,
            AuthProperties properties) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
        this.passwordResetService = passwordResetService;
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
                body.email(),
                body.password(),
                body.fullName(),
                body.mobileNumber(),
                readSessionCookie(request));
        return authenticated(grant, HttpStatus.OK);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<AuthDtos.EmailVerificationResponse> verifyEmail(
            @Valid @RequestBody AuthDtos.TokenRequest body) {
        boolean verified = emailVerificationService.verify(body.token());
        if (!verified) {
            return ResponseEntity.badRequest().body(new AuthDtos.EmailVerificationResponse(
                    false, "This verification link is invalid, expired, or already used."));
        }
        return ResponseEntity.ok(new AuthDtos.EmailVerificationResponse(
                true, "Email verified. You can sign in."));
    }

    @PostMapping("/email-verification/resend")
    public ResponseEntity<AuthDtos.MessageResponse> resendVerification(
            @Valid @RequestBody AuthDtos.EmailVerificationRequest body) {
        emailVerificationService.resend(body.email());
        return ResponseEntity.accepted().body(new AuthDtos.MessageResponse(
                "If the account requires verification, instructions will be sent."));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDtos.AuthResponse> login(
            @Valid @RequestBody AuthDtos.LoginRequest body,
            HttpServletRequest request) {
        AuthService.SessionGrant grant = authService.login(
                body.email(), body.password(), readSessionCookie(request));
        return authenticated(grant, HttpStatus.OK);
    }

    @GetMapping("/session")
    public ResponseEntity<AuthDtos.AuthResponse> session(HttpServletRequest request) {
        Optional<AuthService.SessionIdentity> identity = authService.validateSession(readSessionCookie(request));
        if (identity.isEmpty()) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, clearCookie().toString())
                    .body(new AuthDtos.AuthResponse(false, null, null, null, null, null));
        }
        AuthService.SessionIdentity user = identity.get();
        return ResponseEntity.ok(new AuthDtos.AuthResponse(
                true, user.email(), null, null, user.fullName(), user.role()));
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<AuthDtos.MessageResponse> requestPasswordReset(
            @Valid @RequestBody AuthDtos.PasswordResetRequest body) {
        passwordResetService.requestReset(body.email());
        return ResponseEntity.accepted().body(new AuthDtos.MessageResponse(
                "If the account can be recovered, instructions will be sent."));
    }

    @PostMapping("/password-reset/complete")
    public ResponseEntity<AuthDtos.MessageResponse> completePasswordReset(
            @Valid @RequestBody AuthDtos.PasswordResetCompletion body) {
        if (!passwordResetService.resetPassword(body.token(), body.newPassword())) {
            return ResponseEntity.badRequest().body(new AuthDtos.MessageResponse(
                    "This password reset link is invalid, expired, or already used."));
        }
        return ResponseEntity.ok(new AuthDtos.MessageResponse(
                "Password updated. Please sign in again."));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        authService.logout(readSessionCookie(request));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearCookie().toString())
                .build();
    }

    ResponseEntity<AuthDtos.AuthResponse> authenticated(
            AuthService.SessionGrant grant, HttpStatus status) {
        AuthService.SessionIdentity identity = grant.identity();
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, sessionCookie(grant.sessionToken(), grant.expiresAt()).toString())
                .body(new AuthDtos.AuthResponse(
                        true,
                        identity.email(),
                        grant.csrfToken(),
                        null,
                        identity.fullName(),
                        identity.role()));
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

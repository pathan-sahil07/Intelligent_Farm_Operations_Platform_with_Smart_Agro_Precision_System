package com.intelligentfarm.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegistrationRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 8, max = 1024) String password) {
    }

    public record LoginRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 1024) String password) {
    }

    public record CsrfResponse(String csrfToken) {
    }

    public record AuthResponse(boolean authenticated, String email, String csrfToken) {
    }

    public record ErrorResponse(String code, String message) {
    }
}

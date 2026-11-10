package com.intelligentfarm.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegistrationRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 12, max = 1024) String password,
            @NotBlank @Size(max = 255) String fullName,
            @NotBlank @Size(max = 64) String mobileNumber) {
    }

    public record LoginRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 1024) String password) {
    }

    public record CsrfResponse(String csrfToken) {
    }

    public record PasswordResetRequest(@NotBlank @Email @Size(max = 254) String email) {
    }

    public record EmailVerificationRequest(@NotBlank @Email @Size(max = 254) String email) {
    }

    public record PasswordResetCompletion(
            @NotBlank @Size(max = 256) String token,
            @NotBlank @Size(min = 12, max = 1024) String newPassword) {
    }

    public record TokenRequest(@NotBlank @Size(max = 256) String token) {
    }

    public record AuthResponse(
            boolean authenticated,
            String email,
            String csrfToken,
            String verificationMode,
            String fullName,
            FarmRole role) {
    }

    public record EmailVerificationResponse(boolean verified, String message) {
    }

    public record MessageResponse(String message) {
    }

    public record AssignmentStatus(
            AssignmentAvailability status,
            java.util.UUID organizationId,
            String organizationName) {
    }

    public record FarmAssignmentStatus(
            AssignmentAvailability status,
            java.util.List<java.util.UUID> farmIds,
            java.util.List<FarmSummary> farms,
            String fieldOrLocation) {
    }

    public record FarmSummary(java.util.UUID id, String name) {
    }

    public record CurrentUserResponse(
            java.util.UUID userId,
            String email,
            String fullName,
            FarmRole role,
            java.util.List<String> permissions,
            AssignmentStatus organizationAssignment,
            FarmAssignmentStatus farmAssignments) {
    }

    public record ErrorResponse(String code, String message) {
    }
}

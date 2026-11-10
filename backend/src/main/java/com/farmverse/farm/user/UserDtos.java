package com.farmverse.farm.user;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public final class UserDtos {
    private UserDtos() {
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 150) String fullName,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Size(min = 8, max = 72, message = "Password must be 8 to 72 characters") String password,
            @Size(max = 40) String phone,
            String role) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record UserResponse(Long id, String fullName, String email, String phone, String role,
                               boolean active, LocalDateTime createdAt) {
        public static UserResponse from(AppUser u) {
            return new UserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getRole(),
                    u.isActive(), u.getCreatedAt());
        }
    }

    public record AuthResponse(String token, String tokenType, long expiresIn, UserResponse user) {
    }

    public record LookupResponse(Long id, String fullName, String email, String role) {
        public static LookupResponse from(AppUser u) {
            return new LookupResponse(u.getId(), u.getFullName(), u.getEmail(), u.getRole());
        }
    }

    public record ActiveRequest(boolean active) {
    }

    public record RoleChangeRequest(@NotBlank String role) {
    }

    public record ProfileRequest(@NotBlank @Size(max = 150) String fullName, @Size(max = 40) String phone) {
    }

    public record PasswordChangeRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 72, message = "Password must be 8 to 72 characters") String newPassword) {
    }

    public record RoleResponse(String name, String description, List<String> permissions) {
    }

    public record PermissionResponse(String code, String description) {
    }

    public record RolePermissionsRequest(@NotNull Set<String> permissions) {
    }
}

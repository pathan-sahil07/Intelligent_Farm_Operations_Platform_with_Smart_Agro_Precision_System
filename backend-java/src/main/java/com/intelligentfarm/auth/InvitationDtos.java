package com.intelligentfarm.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class InvitationDtos {

    private InvitationDtos() {
    }

    public record CreateRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @Size(max = 255) String fullName,
            @NotNull FarmRole role,
            List<UUID> farmIds,
            @Size(max = 255) String fieldOrLocation,
            @Size(max = 1000) String message) {
    }

    public record AcceptRequest(
            @NotBlank @Size(max = 256) String token,
            @NotBlank @Size(max = 255) String fullName,
            @NotNull FarmRole selectedRole,
            @Size(min = 12, max = 1024) String password,
            @Size(max = 64) String mobileNumber) {
    }

    public record OrganizationAssignment(
            AssignmentAvailability status,
            UUID organizationId,
            String organizationName) {
    }

    public record FarmAssignments(
            AssignmentAvailability status,
            List<UUID> farmIds,
            List<AuthDtos.FarmSummary> farms,
            String fieldOrLocation) {
    }

    public record Response(
            UUID id,
            String email,
            String fullName,
            FarmRole role,
            InvitationStatus status,
            OrganizationAssignment organizationAssignment,
            FarmAssignments farmAssignments,
            String message,
            Instant createdAt,
            Instant expiresAt,
            Instant acceptedAt) {
    }

    public record Preview(
            boolean valid,
            String email,
            String fullName,
            FarmRole role,
            OrganizationAssignment organizationAssignment,
            FarmAssignments farmAssignments,
            String message,
            String error) {
    }

    public record AcceptResponse(
            boolean authenticated,
            String email,
            String csrfToken) {
    }

    static Response response(Invitation invitation) {
        InvitationStatus status = invitation.status() == InvitationStatus.PENDING
                        && !invitation.expiresAt().isAfter(Instant.now())
                ? InvitationStatus.EXPIRED
                : invitation.status();
        return new Response(
                invitation.id(),
                invitation.email(),
                invitation.fullName(),
                invitation.role(),
                status,
                new OrganizationAssignment(AssignmentAvailability.UNAVAILABLE, null, null),
                new FarmAssignments(AssignmentAvailability.UNAVAILABLE, null, null, null),
                invitation.message(),
                invitation.createdAt(),
                invitation.expiresAt(),
                invitation.acceptedAt());
    }

    static Preview preview(Invitation invitation) {
        return new Preview(
                true,
                invitation.email(),
                invitation.fullName(),
                invitation.role(),
                new OrganizationAssignment(AssignmentAvailability.UNAVAILABLE, null, null),
                new FarmAssignments(AssignmentAvailability.UNAVAILABLE, null, null, null),
                invitation.message(),
                null);
    }
}

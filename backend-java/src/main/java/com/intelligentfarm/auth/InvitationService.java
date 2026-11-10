package com.intelligentfarm.auth;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final AccountRepository accountRepository;
    private final SessionTokenService tokenService;
    private final AuthEmailSender emailSender;
    private final AuthProperties properties;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public InvitationService(
            InvitationRepository invitationRepository,
            AccountRepository accountRepository,
            SessionTokenService tokenService,
            AuthEmailSender emailSender,
            AuthProperties properties,
            PasswordEncoder passwordEncoder,
            Clock clock) {
        this.invitationRepository = Objects.requireNonNull(invitationRepository, "invitationRepository");
        this.accountRepository = Objects.requireNonNull(accountRepository, "accountRepository");
        this.tokenService = Objects.requireNonNull(tokenService, "tokenService");
        this.emailSender = Objects.requireNonNull(emailSender, "emailSender");
        this.properties = Objects.requireNonNull(properties, "properties");
        this.passwordEncoder = Objects.requireNonNull(passwordEncoder, "passwordEncoder");
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    @Transactional
    public Invitation create(AuthPrincipal inviter, InvitationDtos.CreateRequest request) {
        requireCanInvite(inviter.role(), request.role());
        rejectUnavailableAssignments(request.farmIds(), request.fieldOrLocation());
        String email = normalizeEmail(request.email());
        String fullName = normalizeOptional(request.fullName(), 255, "Full name");
        String message = normalizeOptional(request.message(), 1000, "Invitation message");

        Instant now = Instant.now(clock);
        String rawToken = tokenService.generateToken();
        Invitation invitation = new Invitation(
                UUID.randomUUID(),
                email,
                fullName,
                request.role(),
                InvitationStatus.PENDING,
                tokenService.hashToken(rawToken),
                inviter.accountId(),
                now,
                now.plus(properties.getEmail().getInvitationTimeout()),
                null,
                null,
                message);
        invitationRepository.save(invitation);
        emailSender.sendInvitation(email, fullName, rawToken, invitation.role());
        return invitation;
    }

    @Transactional(readOnly = true)
    public List<Invitation> list(AuthPrincipal viewer) {
        if (RolePolicy.invitationRolesFor(viewer.role()).isEmpty()) {
            throw new InvitationException(
                    HttpStatus.FORBIDDEN, "invitation_forbidden", "Your role cannot manage invitations.");
        }
        return invitationRepository.findByCreator(viewer.accountId());
    }

    @Transactional(readOnly = true)
    public InvitationDtos.Preview verify(String rawToken) {
        if (rawToken == null || rawToken.isBlank() || rawToken.length() > 256) {
            return invalidPreview("The invitation token is missing.");
        }
        Optional<Invitation> invitation = invitationRepository.findByTokenHash(
                tokenService.hashToken(rawToken));
        if (invitation.isEmpty()) {
            return invalidPreview("This invitation is invalid or expired.");
        }
        Invitation found = invitation.get();
        if (!found.isPendingAt(Instant.now(clock))) {
            return invalidPreview("This invitation is invalid, expired, or already used.");
        }
        return InvitationDtos.preview(found);
    }

    @Transactional(noRollbackFor = InvitationException.class)
    public Invitation resend(AuthPrincipal inviter, UUID invitationId) {
        Invitation invitation = getOwnedPending(inviter, invitationId);
        Instant now = Instant.now(clock);
        if (!invitation.expiresAt().isAfter(now)) {
            invitationRepository.expire(invitation.id(), now);
            throw new InvitationException(
                    HttpStatus.CONFLICT, "invitation_expired", "This invitation has expired.");
        }
        requireCanInvite(inviter.role(), invitation.role());
        String rawToken = tokenService.generateToken();
        Instant expiresAt = now.plus(properties.getEmail().getInvitationTimeout());
        if (!invitationRepository.replaceTokenAndExpiry(
                invitation.id(), tokenService.hashToken(rawToken), expiresAt)) {
            throw new InvitationException(
                    HttpStatus.CONFLICT, "invitation_not_pending", "This invitation is no longer pending.");
        }
        emailSender.sendInvitation(
                invitation.email(), invitation.fullName(), rawToken, invitation.role());
        return new Invitation(
                invitation.id(),
                invitation.email(),
                invitation.fullName(),
                invitation.role(),
                InvitationStatus.PENDING,
                tokenService.hashToken(rawToken),
                invitation.createdBy(),
                invitation.createdAt(),
                expiresAt,
                null,
                null,
                invitation.message());
    }

    @Transactional
    public void revoke(AuthPrincipal inviter, UUID invitationId) {
        Invitation invitation = getOwnedPending(inviter, invitationId);
        requireCanInvite(inviter.role(), invitation.role());
        if (!invitationRepository.revoke(invitation.id(), Instant.now(clock))) {
            throw new InvitationException(
                    HttpStatus.CONFLICT, "invitation_not_pending", "This invitation is no longer pending.");
        }
    }

    @Transactional
    public AcceptResult accept(
            InvitationDtos.AcceptRequest request, AuthPrincipal authenticatedUser) {
        if (request.token() == null || request.token().isBlank()) {
            throw new InvitationException(
                    HttpStatus.BAD_REQUEST, "invalid_invitation", "The invitation token is invalid.");
        }
        String tokenHash = tokenService.hashToken(request.token());
        Invitation invitation = invitationRepository.findByTokenHashForUpdate(tokenHash)
                .orElseThrow(() -> new InvitationException(
                        HttpStatus.BAD_REQUEST, "invalid_invitation",
                        "This invitation is invalid, expired, or already used."));
        Instant now = Instant.now(clock);
        if (!invitation.isPendingAt(now)) {
            if (invitation.status() == InvitationStatus.PENDING) {
                invitationRepository.expire(invitation.id(), now);
            }
            throw new InvitationException(
                    HttpStatus.BAD_REQUEST, "invalid_invitation",
                    "This invitation is invalid, expired, or already used.");
        }
        if (request.selectedRole() != invitation.role()) {
            throw new InvitationException(
                    HttpStatus.FORBIDDEN, "invitation_role_mismatch",
                    "The selected role does not match the authorized invitation.");
        }
        String mobileNumber = MobileNumberPolicy.normalizeAndValidate(request.mobileNumber(), false);

        Account account;
        boolean accountCreated = false;
        Optional<Account> existing = accountRepository.findByEmail(invitation.email());
        if (existing.isPresent()) {
            account = existing.get();
            if (authenticatedUser == null
                    || !authenticatedUser.accountId().equals(account.getId())) {
                throw new InvitationException(
                        HttpStatus.UNAUTHORIZED, "existing_account_requires_login",
                        "Sign in with the invited email address before accepting this invitation.");
            }
            if (account.getRole() != null && account.getRole() != invitation.role()) {
                throw new InvitationException(
                        HttpStatus.CONFLICT, "account_role_conflict",
                        "This account already has a different role and cannot be changed by this invitation.");
            }
            if (account.getRole() == null) {
                if (!accountRepository.assignRoleAndActivateIfUnassigned(
                        account.getId(),
                        invitation.role(),
                        request.fullName(),
                        mobileNumber,
                        now)) {
                    throw new InvitationException(
                            HttpStatus.CONFLICT, "account_role_conflict",
                            "This account could not be activated with the invitation role.");
                }
                account = accountRepository.findById(account.getId()).orElseThrow(
                        () -> new IllegalStateException("Updated invitation account was not found."));
            } else if (account.getStatus() == AccountStatus.PENDING_VERIFICATION) {
                if (!accountRepository.markEmailVerified(account.getId(), now)) {
                    throw new InvitationException(
                            HttpStatus.CONFLICT, "account_activation_failed",
                            "This account could not be verified using the invitation.");
                }
                account = accountRepository.findById(account.getId()).orElseThrow(
                        () -> new IllegalStateException("Verified invitation account was not found."));
            }
        } else {
            String fullName = request.fullName() == null || request.fullName().isBlank()
                    ? invitation.fullName()
                    : request.fullName().trim();
            if (fullName == null || fullName.isBlank()) {
                throw new AuthService.ValidationException("Enter a full name.");
            }
            PasswordPolicy.validate(request.password());
            account = Account.createVerifiedMember(
                    invitation.email(),
                    passwordEncoder.encode(request.password()),
                    fullName,
                    mobileNumber,
                    invitation.role(),
                    now);
            if (!accountRepository.createIfAbsent(account)) {
                throw new InvitationException(
                        HttpStatus.CONFLICT, "account_conflict",
                        "An account with this email already exists. Sign in to accept the invitation.");
            }
            accountCreated = true;
        }

        if (!account.isEligibleForAuthentication()) {
            throw new InvitationException(
                    HttpStatus.FORBIDDEN, "account_not_active",
                    "This account is not eligible to accept the invitation.");
        }
        if (!invitationRepository.accept(invitation.id(), account.getId(), now)) {
            throw new InvitationException(
                    HttpStatus.CONFLICT, "invitation_not_pending",
                    "This invitation is no longer pending.");
        }
        return new AcceptResult(account, accountCreated);
    }

    private Invitation getOwnedPending(AuthPrincipal inviter, UUID invitationId) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new InvitationException(
                        HttpStatus.NOT_FOUND, "invitation_not_found", "Invitation not found."));
        if (!invitation.createdBy().equals(inviter.accountId())) {
            throw new InvitationException(
                    HttpStatus.FORBIDDEN, "invitation_forbidden",
                    "You cannot manage this invitation.");
        }
        if (invitation.status() != InvitationStatus.PENDING) {
            throw new InvitationException(
                    HttpStatus.CONFLICT, "invitation_not_pending",
                    "This invitation is no longer pending.");
        }
        return invitation;
    }

    private static void requireCanInvite(FarmRole inviterRole, FarmRole invitedRole) {
        if (invitedRole == FarmRole.FARM_OWNER
                || !RolePolicy.invitationRolesFor(inviterRole).contains(invitedRole)) {
            throw new InvitationException(
                    HttpStatus.FORBIDDEN, "invitation_forbidden",
                    "Your role is not authorized to invite this account role.");
        }
    }

    private static void rejectUnavailableAssignments(
            List<UUID> farmIds, String fieldOrLocation) {
        if ((farmIds != null && !farmIds.isEmpty())
                || (fieldOrLocation != null && !fieldOrLocation.isBlank())) {
            throw new InvitationException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "assignment_source_unavailable",
                    "Organization and farm assignments are unavailable; no invitation was created.");
        }
    }

    private static String normalizeEmail(String email) {
        try {
            return Account.normalizeEmail(email);
        } catch (NullPointerException | IllegalArgumentException exception) {
            throw new AuthService.ValidationException("Enter a valid email address.");
        }
    }

    private static String normalizeOptional(String value, int maxLength, String label) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new AuthService.ValidationException(label + " is too long.");
        }
        return normalized;
    }

    private static InvitationDtos.Preview invalidPreview(String error) {
        return new InvitationDtos.Preview(
                false,
                null,
                null,
                null,
                new InvitationDtos.OrganizationAssignment(
                        AssignmentAvailability.UNAVAILABLE, null, null),
                new InvitationDtos.FarmAssignments(
                        AssignmentAvailability.UNAVAILABLE, null, null, null),
                null,
                error);
    }

    public record AcceptResult(Account account, boolean accountCreated) {
    }

    public static class InvitationException extends RuntimeException {

        private final HttpStatus status;
        private final String code;

        public InvitationException(HttpStatus status, String code, String message) {
            super(message);
            this.status = status;
            this.code = code;
        }

        public HttpStatus getStatus() {
            return status;
        }

        public String getCode() {
            return code;
        }
    }
}

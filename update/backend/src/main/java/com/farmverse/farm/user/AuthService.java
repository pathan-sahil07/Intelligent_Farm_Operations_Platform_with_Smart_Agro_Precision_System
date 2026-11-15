package com.farmverse.farm.user;

import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ConflictException;
import com.farmverse.farm.security.JwtService;
import com.farmverse.farm.user.UserDtos.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AuditService audit;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt, AuditService audit) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.audit = audit;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String role = request.role() == null || request.role().isBlank() ? Roles.FARM_OWNER : request.role().trim();
        if (!Roles.SELF_REGISTRATION.contains(role)) {
            throw new BadRequestException("Role must be FARM_OWNER or FIELD_WORKER");
        }
        String email = normalize(request.email());
        if (users.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }
        AppUser user = new AppUser();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(request.password()));
        user.setPhone(request.phone());
        user.setRole(role);
        user.setActive(true);
        user = users.save(user);
        audit.log("REGISTER", "USER", user.getId(), "role=" + role);
        return respond(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        AppUser user = users.findByEmail(normalize(request.email()))
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!encoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        if (!user.isActive()) {
            throw new AccessDeniedException("This account has been deactivated");
        }
        return respond(user);
    }

    private AuthResponse respond(AppUser user) {
        return new AuthResponse(jwt.generate(user.getId(), user.getEmail(), user.getRole()), "Bearer",
                jwt.expiresInSeconds(), UserResponse.from(user));
    }

    static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}

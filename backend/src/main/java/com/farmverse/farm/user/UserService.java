package com.farmverse.farm.user;

import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.security.CurrentUser;
import com.farmverse.farm.user.UserDtos.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository users;
    private final RoleRepository roles;
    private final PermissionRepository permissions;
    private final PasswordEncoder encoder;
    private final AuditService audit;

    public UserService(UserRepository users, RoleRepository roles, PermissionRepository permissions,
                       PasswordEncoder encoder, AuditService audit) {
        this.users = users;
        this.roles = roles;
        this.permissions = permissions;
        this.encoder = encoder;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public UserResponse me() {
        return UserResponse.from(find(CurrentUser.get().getId()));
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> search(String q, String role, int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by("fullName"));
        return users.search(blankToNull(q), blankToNull(role), pageable).map(UserResponse::from);
    }

    @Transactional(readOnly = true)
    public List<LookupResponse> lookup(String q) {
        return users.lookup(q == null ? "" : q.trim(), PageRequest.of(0, 20)).stream()
                .map(LookupResponse::from).toList();
    }

    @Transactional
    public UserResponse setActive(Long id, boolean active) {
        if (id.equals(CurrentUser.get().getId()) && !active) {
            throw new BadRequestException("You cannot deactivate your own account");
        }
        AppUser user = find(id);
        user.setActive(active);
        audit.log(active ? "USER_ACTIVATE" : "USER_DEACTIVATE", "USER", id, user.getEmail());
        return UserResponse.from(users.save(user));
    }

    @Transactional
    public UserResponse setRole(Long id, String role) {
        if (!Roles.ALL.contains(role)) {
            throw new BadRequestException("Unknown role: " + role);
        }
        if (id.equals(CurrentUser.get().getId()) && !Roles.ADMIN.equals(role)) {
            throw new BadRequestException("You cannot change your own role");
        }
        AppUser user = find(id);
        String previous = user.getRole();
        user.setRole(role);
        audit.log("USER_ROLE_CHANGE", "USER", id, previous + " -> " + role);
        return UserResponse.from(users.save(user));
    }

    @Transactional
    public UserResponse updateProfile(ProfileRequest request) {
        AppUser user = find(CurrentUser.get().getId());
        user.setFullName(request.fullName().trim());
        user.setPhone(request.phone());
        return UserResponse.from(users.save(user));
    }

    @Transactional
    public void changePassword(PasswordChangeRequest request) {
        AppUser user = find(CurrentUser.get().getId());
        if (!encoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPasswordHash(encoder.encode(request.newPassword()));
        users.save(user);
        audit.log("PASSWORD_CHANGE", "USER", user.getId(), null);
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> listRoles() {
        return roles.findAll(Sort.by("name")).stream()
                .map(r -> new RoleResponse(r.getName(), r.getDescription(), r.getPermissions().stream().sorted().toList()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> listPermissions() {
        return permissions.findAll(Sort.by("code")).stream()
                .map(p -> new PermissionResponse(p.getCode(), p.getDescription())).toList();
    }

    @Transactional
    public RoleResponse setRolePermissions(String name, Set<String> requested) {
        if (Roles.ADMIN.equals(name)) {
            throw new BadRequestException("The ADMIN role cannot be modified");
        }
        RoleEntity role = roles.findById(name).orElseThrow(() -> new ResourceNotFoundException("Role not found"));
        Set<String> known = permissions.findAll().stream().map(PermissionEntity::getCode).collect(Collectors.toSet());
        for (String code : requested) {
            if (!known.contains(code)) {
                throw new BadRequestException("Unknown permission: " + code);
            }
        }
        role.getPermissions().clear();
        role.getPermissions().addAll(requested);
        audit.log("ROLE_PERMISSIONS_CHANGE", "ROLE", null, name + ": " + requested.stream().sorted().toList());
        RoleEntity saved = roles.save(role);
        return new RoleResponse(saved.getName(), saved.getDescription(), saved.getPermissions().stream().sorted().toList());
    }

    private AppUser find(Long id) {
        return users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}

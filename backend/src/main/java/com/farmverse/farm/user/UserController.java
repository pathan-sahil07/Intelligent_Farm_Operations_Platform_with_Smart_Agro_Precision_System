package com.farmverse.farm.user;

import com.farmverse.farm.user.UserDtos.*;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService users;

    public UserController(UserService users) {
        this.users = users;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public Page<UserResponse> list(@RequestParam(required = false) String q,
                                   @RequestParam(required = false) String role,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        return users.search(q, role, page, size);
    }

    @GetMapping("/lookup")
    @PreAuthorize("hasAuthority('FARM_ASSIGN')")
    public List<LookupResponse> lookup(@RequestParam(defaultValue = "") String q) {
        return users.lookup(q);
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public UserResponse setActive(@PathVariable Long id, @RequestBody ActiveRequest request) {
        return users.setActive(id, request.active());
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public UserResponse setRole(@PathVariable Long id, @Valid @RequestBody RoleChangeRequest request) {
        return users.setRole(id, request.role());
    }

    @PutMapping("/me")
    public UserResponse updateProfile(@Valid @RequestBody ProfileRequest request) {
        return users.updateProfile(request);
    }

    @PostMapping("/me/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody PasswordChangeRequest request) {
        users.changePassword(request);
        return ResponseEntity.noContent().build();
    }
}

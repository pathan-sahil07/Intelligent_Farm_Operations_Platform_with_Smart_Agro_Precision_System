package com.farmverse.farm.user;

import com.farmverse.farm.user.UserDtos.*;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class RoleController {
    private final UserService users;

    public RoleController(UserService users) {
        this.users = users;
    }

    @GetMapping("/roles")
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGE','USER_MANAGE')")
    public List<RoleResponse> roles() {
        return users.listRoles();
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGE','USER_MANAGE')")
    public List<PermissionResponse> permissions() {
        return users.listPermissions();
    }

    @PutMapping("/roles/{name}/permissions")
    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    public RoleResponse setPermissions(@PathVariable String name, @Valid @RequestBody RolePermissionsRequest request) {
        return users.setRolePermissions(name, request.permissions());
    }
}

package com.intelligentfarm.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class CurrentUserController {

    @GetMapping("/me")
    public AuthDtos.CurrentUserResponse currentUser(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return new AuthDtos.CurrentUserResponse(
                principal.accountId(),
                principal.email(),
                principal.fullName(),
                principal.role(),
                RolePolicy.permissionsFor(principal.role()),
                new AuthDtos.AssignmentStatus(
                        AssignmentAvailability.UNAVAILABLE, null, null),
                new AuthDtos.FarmAssignmentStatus(
                        AssignmentAvailability.UNAVAILABLE, null, null, null));
    }
}

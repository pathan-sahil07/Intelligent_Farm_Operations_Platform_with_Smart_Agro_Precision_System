package com.intelligentfarm.organization;

import com.intelligentfarm.auth.AuthPrincipal;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private final OrganizationRepository organizationRepository;

    public OrganizationController(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    @GetMapping("/current")
    public OrganizationResponse getCurrentOrganization(
            Authentication authentication) {

        if (authentication == null
                || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        UUID accountId = principal.accountId();

        return organizationRepository
                .findCurrentByAccountId(accountId)
                .orElse(null);
    }
}



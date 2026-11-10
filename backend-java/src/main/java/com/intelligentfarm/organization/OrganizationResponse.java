package com.intelligentfarm.organization;

import java.util.UUID;

public record OrganizationResponse(
        UUID id,
        String name,
        String email,
        String contact,
        String address,
        String description,
        UUID createdBy,
        String createdAt,
        long farmCount,
        long userCount
) {}
    


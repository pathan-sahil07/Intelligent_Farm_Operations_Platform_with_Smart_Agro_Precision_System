package com.farmverse.farm.notification;

import com.farmverse.farm.security.FarmAccessService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationRefreshController {
    private final NotificationGeneratorService generator;
    private final FarmAccessService access;

    public NotificationRefreshController(NotificationGeneratorService generator, FarmAccessService access) {
        this.generator = generator;
        this.access = access;
    }

    /** Runs the generators now for the farms the caller can access. */
    @PostMapping("/refresh")
    public Map<String, Integer> refresh() {
        return Map.of("processed", generator.generate(access.accessibleFarmIds()));
    }
}

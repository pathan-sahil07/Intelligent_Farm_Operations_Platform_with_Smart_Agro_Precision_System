package com.farmverse.farm.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Creates the first ADMIN account from ADMIN_EMAIL / ADMIN_PASSWORD (environment) when it does not exist yet.
 * Nothing is created when the variables are unset, so no default credentials ever ship.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class AdminBootstrap implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String email;
    private final String password;
    private final String fullName;

    public AdminBootstrap(UserRepository users, PasswordEncoder encoder,
                          @Value("${admin.email:}") String email,
                          @Value("${admin.password:}") String password,
                          @Value("${admin.full-name:Platform Administrator}") String fullName) {
        this.users = users;
        this.encoder = encoder;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (email.isBlank() || password.isBlank()) {
            log.info("ADMIN_EMAIL/ADMIN_PASSWORD not set: no administrator bootstrapped");
            return;
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmail(normalized)) {
            return;
        }
        AppUser admin = new AppUser();
        admin.setFullName(fullName);
        admin.setEmail(normalized);
        admin.setPasswordHash(encoder.encode(password));
        admin.setRole(Roles.ADMIN);
        admin.setActive(true);
        users.save(admin);
        log.info("Bootstrapped administrator account {}", normalized);
    }
}

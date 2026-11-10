package com.intelligentfarm.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "farm.auth.email", name = "mode", havingValue = "local-console")
public class LocalConsoleAuthEmailSender implements AuthEmailSender {

    private static final Logger LOGGER = LoggerFactory.getLogger(LocalConsoleAuthEmailSender.class);

    private final AuthProperties properties;

    public LocalConsoleAuthEmailSender(AuthProperties properties) {
        this.properties = properties;
    }

    @Override
    public String mode() {
        return "local-console";
    }

    @Override
    public void sendVerification(String email, String fullName, String token) {
        LOGGER.info("Local email verification for {}: {}", email,
                EmailLinks.build(properties.getEmail().getBaseUrl(), "/verify-email", token));
    }

    @Override
    public void sendPasswordReset(String email, String fullName, String token) {
        LOGGER.info("Local password reset for {}: {}", email,
                EmailLinks.build(properties.getEmail().getBaseUrl(), "/reset-password", token));
    }

    @Override
    public void sendInvitation(String email, String fullName, String token, FarmRole role) {
        LOGGER.info("Local {} invitation for {}: {}", role, email,
                EmailLinks.build(properties.getEmail().getBaseUrl(), "/invitation/accept", token));
    }
}

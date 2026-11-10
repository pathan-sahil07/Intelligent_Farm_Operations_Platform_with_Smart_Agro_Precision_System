package com.intelligentfarm.auth;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "farm.auth.email", name = "mode", havingValue = "smtp")
public class SpringMailAuthEmailSender implements AuthEmailSender {

    private final JavaMailSender mailSender;
    private final AuthProperties properties;

    public SpringMailAuthEmailSender(JavaMailSender mailSender, AuthProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    @Override
    public String mode() {
        return "smtp";
    }

    @Override
    public void sendVerification(String email, String fullName, String token) {
        send(email, "Verify your FarmVerse account",
                "Hello " + greeting(fullName) + ",\n\nVerify your email address:\n"
                        + EmailLinks.build(properties.getEmail().getBaseUrl(), "/verify-email", token));
    }

    @Override
    public void sendPasswordReset(String email, String fullName, String token) {
        send(email, "Reset your FarmVerse password",
                "Hello " + greeting(fullName) + ",\n\nReset your password:\n"
                        + EmailLinks.build(properties.getEmail().getBaseUrl(), "/reset-password", token));
    }

    @Override
    public void sendInvitation(String email, String fullName, String token, FarmRole role) {
        send(email, "FarmVerse invitation",
                "Hello " + greeting(fullName) + ",\n\nYou have been invited as " + role + ":\n"
                        + EmailLinks.build(properties.getEmail().getBaseUrl(), "/invitation/accept", token));
    }

    private void send(String recipient, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.getEmail().getFromAddress());
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    private static String greeting(String fullName) {
        return fullName == null || fullName.isBlank() ? "there" : fullName;
    }
}

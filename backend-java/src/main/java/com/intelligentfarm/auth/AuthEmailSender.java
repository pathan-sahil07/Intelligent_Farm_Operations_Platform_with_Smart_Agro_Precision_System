package com.intelligentfarm.auth;

public interface AuthEmailSender {

    String mode();

    void sendVerification(String email, String fullName, String token);

    void sendPasswordReset(String email, String fullName, String token);

    void sendInvitation(String email, String fullName, String token, FarmRole role);
}

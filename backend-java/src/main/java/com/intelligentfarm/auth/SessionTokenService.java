package com.intelligentfarm.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Objects;

public class SessionTokenService {

    private static final int TOKEN_BYTES = 32;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public String generateToken() {
        byte[] tokenBytes = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    public String hashToken(String token) {
        Objects.requireNonNull(token, "token");
        if (token.isBlank()) {
            throw new IllegalArgumentException("token must not be blank");
        }

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(sha256(token.getBytes(StandardCharsets.UTF_8)));
    }

    public boolean matches(String token, String expectedHash) {
        Objects.requireNonNull(token, "token");
        Objects.requireNonNull(expectedHash, "expectedHash");
        if (token.isBlank()) {
            return false;
        }

        byte[] expectedHashBytes;
        try {
            expectedHashBytes = Base64.getUrlDecoder().decode(expectedHash);
        } catch (IllegalArgumentException exception) {
            return false;
        }
        if (expectedHashBytes.length != 32) {
            return false;
        }

        return MessageDigest.isEqual(
                sha256(token.getBytes(StandardCharsets.UTF_8)),
                expectedHashBytes);
    }

    private static byte[] sha256(byte[] value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}

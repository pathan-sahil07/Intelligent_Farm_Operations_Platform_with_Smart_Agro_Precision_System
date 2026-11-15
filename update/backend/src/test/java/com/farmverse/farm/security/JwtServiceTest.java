package com.farmverse.farm.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
    private static final String SECRET = "unit-test-secret-unit-test-secret-1234567890";

    private JwtService service(String secret, long minutes) {
        return new JwtService(secret, minutes, new MockEnvironment());
    }

    @Test
    void validTokenRoundTripsUserId() {
        JwtService jwt = service(SECRET, 5);
        String token = jwt.generate(42L, "a@b.c", "ADMIN");
        assertEquals(42L, jwt.validate(token).orElseThrow());
    }

    @Test
    void tamperedTokenIsRejected() {
        JwtService jwt = service(SECRET, 5);
        String token = jwt.generate(42L, "a@b.c", "ADMIN");
        assertTrue(jwt.validate(token.substring(0, token.length() - 3) + "abc").isEmpty());
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        String token = service(SECRET, 5).generate(1L, "a@b.c", "ADMIN");
        assertTrue(service("another-secret-another-secret-0987654321", 5).validate(token).isEmpty());
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService jwt = service(SECRET, -1);
        assertTrue(jwt.validate(jwt.generate(1L, "a@b.c", "ADMIN")).isEmpty());
    }

    @Test
    void garbageIsRejected() {
        assertTrue(service(SECRET, 5).validate("not-a-jwt").isEmpty());
    }

    @Test
    void missingSecretFailsFastOutsideDemoProfile() {
        assertThrows(IllegalStateException.class, () -> service("", 5));
        assertThrows(IllegalStateException.class, () -> service("short", 5));
    }

    @Test
    void demoProfileGeneratesAnEphemeralSecret() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("demo");
        JwtService jwt = new JwtService("", 5, env);
        assertEquals(1L, jwt.validate(jwt.generate(1L, "a@b.c", "ADMIN")).orElseThrow());
    }
}

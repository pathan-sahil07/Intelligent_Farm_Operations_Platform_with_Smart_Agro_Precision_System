package com.farmverse.farm.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMinutes;

    public JwtService(@Value("${jwt.secret:}") String secret,
                      @Value("${jwt.expiration-minutes:120}") long expirationMinutes,
                      Environment env) {
        String effective = secret;
        if (effective == null || effective.length() < 32) {
            if (env.acceptsProfiles(Profiles.of("demo", "test"))) {
                // Demo/test only: a random per-run secret, never persisted or committed.
                byte[] random = new byte[48];
                new SecureRandom().nextBytes(random);
                effective = Base64.getEncoder().encodeToString(random);
            } else {
                throw new IllegalStateException(
                        "JWT_SECRET must be set to a random value of at least 32 characters");
            }
        }
        this.key = Keys.hmacShaKeyFor(effective.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
    }

    public long expiresInSeconds() {
        return expirationMinutes * 60;
    }

    public String generate(Long userId, String email, String role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMinutes * 60_000L))
                .signWith(key)
                .compact();
    }

    /** Returns the user id when the token is valid and unexpired. */
    public Optional<Long> validate(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            return Optional.of(Long.valueOf(claims.getSubject()));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}

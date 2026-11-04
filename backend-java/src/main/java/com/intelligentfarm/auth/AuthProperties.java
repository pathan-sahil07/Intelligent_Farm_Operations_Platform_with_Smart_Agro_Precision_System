package com.intelligentfarm.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "farm.auth")
public class AuthProperties {

    @NotNull
    private Duration idleTimeout = Duration.ofMinutes(30);

    @NotNull
    private Duration absoluteTimeout = Duration.ofHours(12);

    @NotNull
    private Duration preAuthTimeout = Duration.ofMinutes(15);

    @NotNull
    private Duration passwordResetTokenTimeout = Duration.ofMinutes(30);

    @Valid
    @NotNull
    private final Cookie cookie = new Cookie();

    @Valid
    @NotNull
    private final Hmac hmac = new Hmac();

    @Valid
    @NotNull
    private final RateLimits rateLimits = new RateLimits();

    @AssertTrue(message = "idle-timeout must be positive and shorter than absolute-timeout")
    public boolean isSessionTimeoutConfigurationValid() {
        return isPositive(idleTimeout)
                && isPositive(absoluteTimeout)
                && idleTimeout.compareTo(absoluteTimeout) < 0
                && isPositive(preAuthTimeout)
                && isPositive(passwordResetTokenTimeout);
    }

    private static boolean isPositive(Duration duration) {
        return duration != null && !duration.isNegative() && !duration.isZero();
    }

    public Duration getIdleTimeout() {
        return idleTimeout;
    }

    public void setIdleTimeout(Duration idleTimeout) {
        this.idleTimeout = idleTimeout;
    }

    public Duration getAbsoluteTimeout() {
        return absoluteTimeout;
    }

    public void setAbsoluteTimeout(Duration absoluteTimeout) {
        this.absoluteTimeout = absoluteTimeout;
    }

    public Duration getPreAuthTimeout() {
        return preAuthTimeout;
    }

    public void setPreAuthTimeout(Duration preAuthTimeout) {
        this.preAuthTimeout = preAuthTimeout;
    }

    public Duration getPasswordResetTokenTimeout() {
        return passwordResetTokenTimeout;
    }

    public void setPasswordResetTokenTimeout(Duration passwordResetTokenTimeout) {
        this.passwordResetTokenTimeout = passwordResetTokenTimeout;
    }

    public Cookie getCookie() {
        return cookie;
    }

    public Hmac getHmac() {
        return hmac;
    }

    public RateLimits getRateLimits() {
        return rateLimits;
    }

    public static class Cookie {

        @NotBlank
        private String name = "__Host-FARM_SESSION";

        private boolean secure = true;
        private boolean httpOnly = true;

        @NotBlank
        private String sameSite = "Lax";

        @NotBlank
        private String path = "/";

        @AssertTrue(message = "__Host- cookies require Secure and Path=/")
        public boolean isHostCookieConfigurationValid() {
            return name != null
                    && path != null
                    && (!name.startsWith("__Host-") || (secure && "/".equals(path)));
        }

        @AssertTrue(message = "SameSite must be Lax, Strict, or None; session cookies must be HttpOnly")
        public boolean isCookiePolicyValid() {
            return httpOnly
                    && ("Lax".equalsIgnoreCase(sameSite)
                            || "Strict".equalsIgnoreCase(sameSite)
                            || "None".equalsIgnoreCase(sameSite))
                    && (!"None".equalsIgnoreCase(sameSite) || secure);
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public boolean isSecure() {
            return secure;
        }

        public void setSecure(boolean secure) {
            this.secure = secure;
        }

        public boolean isHttpOnly() {
            return httpOnly;
        }

        public void setHttpOnly(boolean httpOnly) {
            this.httpOnly = httpOnly;
        }

        public String getSameSite() {
            return sameSite;
        }

        public void setSameSite(String sameSite) {
            this.sameSite = sameSite;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }
    }

    public static class Hmac {

        @NotBlank
        private String currentKeyVersion = "";

        private Map<String, String> keys = new LinkedHashMap<>();

        private Map<String, Instant> previousKeyAcceptedUntil = new LinkedHashMap<>();

        @AssertTrue(message = "the current HMAC key version must have a Base64 key of at least 256 bits")
        public boolean isCurrentKeyValid() {
            if (currentKeyVersion == null || currentKeyVersion.isBlank() || keys == null) {
                return false;
            }
            return keys.containsKey(currentKeyVersion)
                    && keys.entrySet().stream().allMatch(entry ->
                            entry.getKey() != null
                                    && !entry.getKey().isBlank()
                                    && hasAtLeast256Bits(entry.getValue()));
        }

        @AssertTrue(message = "each previous HMAC key must have a future acceptance expiry")
        public boolean arePreviousKeysValid() {
            if (previousKeyAcceptedUntil == null || keys == null) {
                return false;
            }
            Instant now = Instant.now();
            return keys.keySet().stream()
                            .filter(keyVersion -> !Objects.equals(keyVersion, currentKeyVersion))
                            .allMatch(previousKeyAcceptedUntil::containsKey)
                    && previousKeyAcceptedUntil.entrySet().stream().allMatch(entry ->
                            !Objects.equals(entry.getKey(), currentKeyVersion)
                                    && keys.containsKey(entry.getKey())
                                    && entry.getValue() != null
                                    && entry.getValue().isAfter(now));
        }

        private static boolean hasAtLeast256Bits(String encodedKey) {
            if (encodedKey == null || encodedKey.isBlank()) {
                return false;
            }
            try {
                return Base64.getDecoder().decode(encodedKey).length >= 32;
            } catch (IllegalArgumentException exception) {
                return false;
            }
        }

        public String getCurrentKeyVersion() {
            return currentKeyVersion;
        }

        public void setCurrentKeyVersion(String currentKeyVersion) {
            this.currentKeyVersion = currentKeyVersion;
        }

        public Map<String, String> getKeys() {
            return keys;
        }

        public void setKeys(Map<String, String> keys) {
            this.keys = keys;
        }

        public Map<String, Instant> getPreviousKeyAcceptedUntil() {
            return previousKeyAcceptedUntil;
        }

        public void setPreviousKeyAcceptedUntil(Map<String, Instant> previousKeyAcceptedUntil) {
            this.previousKeyAcceptedUntil = previousKeyAcceptedUntil;
        }
    }

    public static class RateLimits {

        @Valid
        @NotNull
        private final Limit login = new Limit(10, 30, Duration.ofMinutes(15));

        @Valid
        @NotNull
        private final Limit passwordReset = new Limit(3, 20, Duration.ofHours(1));

        public Limit getLogin() {
            return login;
        }

        public Limit getPasswordReset() {
            return passwordReset;
        }
    }

    public static class Limit {

        private int accountAttempts;
        private int clientAttempts;

        @NotNull
        private Duration window;

        public Limit() {
        }

        private Limit(int accountAttempts, int clientAttempts, Duration window) {
            this.accountAttempts = accountAttempts;
            this.clientAttempts = clientAttempts;
            this.window = window;
        }

        @AssertTrue(message = "rate-limit counts and window must be positive")
        public boolean isValid() {
            return accountAttempts > 0
                    && clientAttempts > 0
                    && window != null
                    && !window.isNegative()
                    && !window.isZero();
        }

        public int getAccountAttempts() {
            return accountAttempts;
        }

        public void setAccountAttempts(int accountAttempts) {
            this.accountAttempts = accountAttempts;
        }

        public int getClientAttempts() {
            return clientAttempts;
        }

        public void setClientAttempts(int clientAttempts) {
            this.clientAttempts = clientAttempts;
        }

        public Duration getWindow() {
            return window;
        }

        public void setWindow(Duration window) {
            this.window = window;
        }
    }
}

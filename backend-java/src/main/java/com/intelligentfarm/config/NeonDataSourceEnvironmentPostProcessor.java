package com.intelligentfarm.config;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Permanently sanitizes and configures the PostgreSQL JDBC connection for Neon Cloud.
 *
 * Prevents "Driver org.postgresql.Driver claims to not accept jdbcUrl" by:
 * 1. Stripping single/double quotation marks accidentally included in .env files or environment variables.
 * 2. Normalizing standard PostgreSQL URI schemes (postgres:// or postgresql://) into pgjdbc-compliant jdbc:postgresql://.
 * 3. Extracting embedded credentials from standard Neon connection strings into username and password properties.
 * 4. Applying optimal HikariCP pooler settings (keepalive, lifetime, timeout) suited for Neon Serverless PostgreSQL.
 * 5. Providing safe fallback defaults for authentication and cookie configuration in local environments.
 */
public class NeonDataSourceEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final Logger log = LoggerFactory.getLogger(NeonDataSourceEnvironmentPostProcessor.class);
    private static final String DEFAULT_HMAC_KEY_V1 = "h8ZkP6qX9yL3mN7vB2cR5tE1wK4jF8sA0dG7hJ9kL2m=";

    @Override
    public int getOrder() {
        // Must run after ConfigDataEnvironmentPostProcessor (which imports application.yml and .env)
        return Ordered.LOWEST_PRECEDENCE;
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> overrides = new HashMap<>();

        // 1. Resolve raw URL from various possible property sources
        String rawUrl = environment.getProperty("spring.datasource.url");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = environment.getProperty("SPRING_DATASOURCE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = environment.getProperty("DATABASE_URL");
        }

        if (rawUrl != null && !rawUrl.isBlank()) {
            String sanitizedUrl = cleanQuotes(rawUrl);

            // Handle standard postgres:// or postgresql:// connection strings
            if (sanitizedUrl.startsWith("postgres://") || sanitizedUrl.startsWith("postgresql://")) {
                try {
                    String uriString = sanitizedUrl.startsWith("postgres://")
                            ? "http://" + sanitizedUrl.substring("postgres://".length())
                            : "http://" + sanitizedUrl.substring("postgresql://".length());
                    URI parsed = URI.create(uriString);

                    String userInfo = parsed.getUserInfo();
                    if (userInfo != null && !userInfo.isBlank()) {
                        String[] parts = userInfo.split(":", 2);
                        if (parts.length > 0 && !parts[0].isBlank()) {
                            overrides.put("spring.datasource.username", parts[0]);
                        }
                        if (parts.length > 1 && !parts[1].isBlank()) {
                            overrides.put("spring.datasource.password", parts[1]);
                        }
                    }

                    int port = parsed.getPort() > 0 ? parsed.getPort() : 5432;
                    String path = parsed.getPath();
                    if (path != null && path.startsWith("/")) {
                        path = path.substring(1);
                    }
                    String query = parsed.getQuery() != null ? "?" + parsed.getQuery() : "";
                    sanitizedUrl = "jdbc:postgresql://" + parsed.getHost() + ":" + port + "/" + path + query;
                } catch (Exception e) {
                    // Fallback to simple prefix replacement
                    if (sanitizedUrl.startsWith("postgres://")) {
                        sanitizedUrl = "jdbc:postgresql://" + sanitizedUrl.substring("postgres://".length());
                    } else {
                        sanitizedUrl = "jdbc:postgresql://" + sanitizedUrl.substring("postgresql://".length());
                    }
                }
            } else if (!sanitizedUrl.startsWith("jdbc:postgresql:")) {
                // If the user forgot jdbc: prefix
                if (sanitizedUrl.contains("neon.tech") || sanitizedUrl.contains("5432")) {
                    sanitizedUrl = "jdbc:postgresql://" + sanitizedUrl.replaceFirst("^jdbc:", "");
                }
            }

            overrides.put("spring.datasource.url", sanitizedUrl);
            log.info("NeonDataSourceEnvironmentPostProcessor: Sanitized JDBC URL successfully (starts with jdbc:postgresql: {})",
                    sanitizedUrl.startsWith("jdbc:postgresql:"));
        }

        // 2. Sanitize username and password (strip surrounding quotes if present)
        String rawUsername = environment.getProperty("spring.datasource.username");
        if (rawUsername == null || rawUsername.isBlank()) {
            rawUsername = environment.getProperty("SPRING_DATASOURCE_USERNAME");
        }
        if (rawUsername != null && !rawUsername.isBlank()) {
            overrides.put("spring.datasource.username", cleanQuotes(rawUsername));
        }

        String rawPassword = environment.getProperty("spring.datasource.password");
        if (rawPassword == null || rawPassword.isBlank()) {
            rawPassword = environment.getProperty("SPRING_DATASOURCE_PASSWORD");
        }
        if (rawPassword != null && !rawPassword.isBlank()) {
            overrides.put("spring.datasource.password", cleanQuotes(rawPassword));
        }

        // 3. Configure HikariCP connection pool settings optimized for Neon serverless pooler
        overrides.putIfAbsent("spring.datasource.hikari.keepalive-time", "30000");
        overrides.putIfAbsent("spring.datasource.hikari.max-lifetime", "600000");
        overrides.putIfAbsent("spring.datasource.hikari.idle-timeout", "300000");
        overrides.putIfAbsent("spring.datasource.hikari.connection-timeout", "15000");
        overrides.putIfAbsent("spring.datasource.hikari.minimum-idle", "1");

        // 4. Ensure authentication & cookie local dev safety defaults are satisfied
        String cookieName = environment.getProperty("farm.auth.cookie.name");
        if (cookieName == null || cookieName.isBlank()) {
            overrides.put("farm.auth.cookie.name", "FARM_SESSION");
        }
        String cookieSecure = environment.getProperty("farm.auth.cookie.secure");
        if (cookieSecure == null || cookieSecure.isBlank()) {
            overrides.put("farm.auth.cookie.secure", "false");
        }
        String emailMode = environment.getProperty("farm.auth.email.mode");
        if (emailMode == null || emailMode.isBlank()) {
            overrides.put("farm.auth.email.mode", "local-console");
        }
        String fromAddress = environment.getProperty("farm.auth.email.from-address");
        if (fromAddress == null || fromAddress.isBlank()) {
            overrides.put("farm.auth.email.from-address", "no-reply@farmverse.invalid");
        }
        String keyVersion = environment.getProperty("farm.auth.hmac.current-key-version");
        if (keyVersion == null || keyVersion.isBlank()) {
            overrides.put("farm.auth.hmac.current-key-version", "v1");
        }
        String keyV1 = environment.getProperty("farm.auth.hmac.keys.v1");
        if (keyV1 == null || keyV1.isBlank()) {
            overrides.put("farm.auth.hmac.keys.v1", DEFAULT_HMAC_KEY_V1);
        }

        // 5. Sanitize CORS allowed origins
        String corsAllowed = environment.getProperty("farm.auth.cors.allowed-origins");
        if (corsAllowed == null || corsAllowed.isBlank()) {
            corsAllowed = environment.getProperty("FARM_AUTH_ALLOWED_ORIGINS");
        }
        if (corsAllowed != null && !corsAllowed.isBlank()) {
            overrides.put("farm.auth.cors.allowed-origins", cleanQuotes(corsAllowed));
        } else {
            overrides.put("farm.auth.cors.allowed-origins",
                    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174");
        }

        environment.getPropertySources().addFirst(new MapPropertySource("sanitizedNeonDataSourceProperties", overrides));
    }

    private static String cleanQuotes(String val) {
        if (val == null) {
            return null;
        }
        String trimmed = val.trim();
        while ((trimmed.startsWith("'") && trimmed.endsWith("'"))
                || (trimmed.startsWith("\"") && trimmed.endsWith("\""))) {
            if (trimmed.length() < 2) {
                break;
            }
            trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
        }
        return trimmed;
    }
}


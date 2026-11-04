package com.intelligentfarm.auth;

import java.time.Clock;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AuthConfiguration {

    /*
     * Defaults are production-safe (__Host cookie, Secure, HttpOnly, SameSite=Lax, Path=/).
     * For local plain-HTTP development, set FARM_AUTH_COOKIE_NAME=FARM_SESSION and
     * FARM_AUTH_COOKIE_SECURE=false. Production should keep the defaults or equivalent values.
     */
    @Bean
    AuthProperties authProperties(Environment environment) {
        AuthProperties properties = Binder.get(environment)
                .bind("farm.auth", Bindable.of(AuthProperties.class))
                .orElseGet(AuthProperties::new);
        if (!properties.isSessionTimeoutConfigurationValid()
                || properties.getCookie().getName() == null
                || properties.getCookie().getName().isBlank()
                || properties.getCookie().getPath() == null
                || properties.getCookie().getPath().isBlank()
                || !properties.getCookie().isHostCookieConfigurationValid()
                || !properties.getCookie().isCookiePolicyValid()) {
            throw new IllegalStateException("Invalid farm.auth session or cookie configuration");
        }
        return properties;
    }

    @Bean
    SessionTokenService sessionTokenService() {
        return new SessionTokenService();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    }

    @Bean
    Clock authClock() {
        return Clock.systemUTC();
    }
}

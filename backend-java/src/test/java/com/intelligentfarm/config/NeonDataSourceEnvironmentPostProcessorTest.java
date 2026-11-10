package com.intelligentfarm.config;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.mock.env.MockEnvironment;

class NeonDataSourceEnvironmentPostProcessorTest {

    @Test
    void testSanitizesQuotedJdbcUrl() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("spring.datasource.url", "'jdbc:postgresql://ep-hidden-rain.aws.neon.tech/neondb?sslmode=require'");
        env.setProperty("spring.datasource.username", "\"neondb_owner\"");
        env.setProperty("spring.datasource.password", "'mysecret'");

        NeonDataSourceEnvironmentPostProcessor processor = new NeonDataSourceEnvironmentPostProcessor();
        processor.postProcessEnvironment(env, new SpringApplication());

        String url = env.getProperty("spring.datasource.url");
        assertNotNull(url);
        assertTrue(url.startsWith("jdbc:postgresql:"));
        assertFalse(url.startsWith("'"));
        assertFalse(url.endsWith("'"));

        String user = env.getProperty("spring.datasource.username");
        assertEquals("neondb_owner", user);

        String pass = env.getProperty("spring.datasource.password");
        assertEquals("mysecret", pass);
    }

    @Test
    void testNormalizesStandardPostgresUri() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("DATABASE_URL", "postgresql://user123:pass456@ep-sample.aws.neon.tech:5432/neondb?sslmode=require");

        NeonDataSourceEnvironmentPostProcessor processor = new NeonDataSourceEnvironmentPostProcessor();
        processor.postProcessEnvironment(env, new SpringApplication());

        String url = env.getProperty("spring.datasource.url");
        assertNotNull(url);
        assertTrue(url.startsWith("jdbc:postgresql://ep-sample.aws.neon.tech:5432/neondb?sslmode=require"));
        assertEquals("user123", env.getProperty("spring.datasource.username"));
        assertEquals("pass456", env.getProperty("spring.datasource.password"));
    }

    @Test
    void testInjectsNeonHikariAndAuthDefaults() {
        MockEnvironment env = new MockEnvironment();
        NeonDataSourceEnvironmentPostProcessor processor = new NeonDataSourceEnvironmentPostProcessor();
        processor.postProcessEnvironment(env, new SpringApplication());

        assertEquals("30000", env.getProperty("spring.datasource.hikari.keepalive-time"));
        assertEquals("FARM_SESSION", env.getProperty("farm.auth.cookie.name"));
        assertEquals("false", env.getProperty("farm.auth.cookie.secure"));
        assertEquals("local-console", env.getProperty("farm.auth.email.mode"));
        assertEquals("v1", env.getProperty("farm.auth.hmac.current-key-version"));
        assertNotNull(env.getProperty("farm.auth.hmac.keys.v1"));
    }
}


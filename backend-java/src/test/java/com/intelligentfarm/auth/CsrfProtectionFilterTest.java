package com.intelligentfarm.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.servlet.FilterChain;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class CsrfProtectionFilterTest {

    private AuthService authService;
    private AuthProperties properties;
    private CsrfProtectionFilter filter;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        properties = new AuthProperties();
        filter = new CsrfProtectionFilter(authService, properties);
    }

    @Test
    void rejectsUnsafeApiRequestWithoutValidCsrfToken() throws Exception {
        MockHttpServletRequest request = request("wrong-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean();
        FilterChain chain = (req, res) -> continued.set(true);
        when(authService.isCsrfValid("session-token", "wrong-token")).thenReturn(false);

        filter.doFilter(request, response, chain);

        assertEquals(403, response.getStatus());
        assertFalse(continued.get());
        verify(authService).isCsrfValid("session-token", "wrong-token");
    }

    @Test
    void allowsUnsafeApiRequestWithValidCsrfToken() throws Exception {
        MockHttpServletRequest request = request("csrf-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean();
        FilterChain chain = (req, res) -> continued.set(true);
        when(authService.isCsrfValid("session-token", "csrf-token")).thenReturn(true);

        filter.doFilter(request, response, chain);

        assertTrue(continued.get());
        verify(authService).isCsrfValid("session-token", "csrf-token");
    }

    private MockHttpServletRequest request(String csrfToken) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath("/api/auth/login");
        request.setMethod("POST");
        request.setCookies(new jakarta.servlet.http.Cookie(
                properties.getCookie().getName(), "session-token"));
        request.addHeader("X-CSRF-Token", csrfToken);
        return request;
    }
}

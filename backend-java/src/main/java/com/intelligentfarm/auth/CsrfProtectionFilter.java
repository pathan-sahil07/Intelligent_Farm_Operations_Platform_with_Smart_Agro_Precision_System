package com.intelligentfarm.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.web.filter.OncePerRequestFilter;

public class CsrfProtectionFilter extends OncePerRequestFilter {

    private static final String CSRF_HEADER = "X-CSRF-Token";

    private final AuthService authService;
    private final AuthProperties properties;

    public CsrfProtectionFilter(AuthService authService, AuthProperties properties) {
        this.authService = authService;
        this.properties = properties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String method = request.getMethod();
        return !request.getServletPath().startsWith("/api/")
                || "GET".equalsIgnoreCase(method)
                || "HEAD".equalsIgnoreCase(method)
                || "OPTIONS".equalsIgnoreCase(method)
                || "TRACE".equalsIgnoreCase(method);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String sessionToken = null;
        if (request.getCookies() != null) {
            String cookieName = properties.getCookie().getName();
            for (var cookie : request.getCookies()) {
                if (cookieName.equals(cookie.getName())) {
                    sessionToken = cookie.getValue();
                    break;
                }
            }
        }
        if (!authService.isCsrfValid(sessionToken, request.getHeader(CSRF_HEADER))) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"code\":\"csrf_invalid\",\"message\":\"A valid CSRF token is required.\"}");
            response.getWriter().flush();
            return;
        }
        filterChain.doFilter(request, response);
    }
}

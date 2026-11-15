package com.farmverse.farm.security;

import com.farmverse.farm.user.AppUser;
import com.farmverse.farm.user.RoleRepository;
import com.farmverse.farm.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.Set;

/** Not a @Component on purpose: it is registered only inside the security filter chain. */
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    private final UserRepository users;
    private final RoleRepository roles;

    public JwtAuthenticationFilter(JwtService jwt, UserRepository users, RoleRepository roles) {
        this.jwt = jwt;
        this.users = users;
        this.roles = roles;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ") && SecurityContextHolder.getContext().getAuthentication() == null) {
            Optional<Long> userId = jwt.validate(header.substring(7).trim());
            Optional<AppUser> user = userId.flatMap(users::findById).filter(AppUser::isActive);
            if (user.isPresent()) {
                AppUser u = user.get();
                Set<String> permissions = roles.findById(u.getRole())
                        .map(r -> Set.copyOf(r.getPermissions()))
                        .orElse(Set.of());
                AppUserPrincipal principal = new AppUserPrincipal(u.getId(), u.getEmail(), u.getFullName(),
                        u.getRole(), u.isActive(), permissions);
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(request, response);
    }
}

package com.farmverse.farm.user;

import com.farmverse.farm.audit.AuditService;
import com.farmverse.farm.exception.BadRequestException;
import com.farmverse.farm.exception.ConflictException;
import com.farmverse.farm.security.JwtService;
import com.farmverse.farm.user.UserDtos.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UserRepository users;
    @Mock AuditService audit;
    BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    AuthService service;

    @BeforeEach
    void setUp() {
        JwtService jwt = new JwtService("auth-test-secret-auth-test-secret-123456789", 5, new MockEnvironment());
        service = new AuthService(users, encoder, jwt, audit);
    }

    private AppUser user(boolean active) {
        AppUser u = new AppUser();
        u.setId(3L);
        u.setFullName("Asha");
        u.setEmail("asha@farm.io");
        u.setPasswordHash(encoder.encode("correct-horse"));
        u.setRole("FARM_OWNER");
        u.setActive(active);
        return u;
    }

    @Test
    void registerHashesPasswordAndDefaultsToFarmOwner() {
        when(users.existsByEmail("asha@farm.io")).thenReturn(false);
        when(users.save(any(AppUser.class))).thenAnswer(i -> {
            AppUser u = i.getArgument(0);
            u.setId(1L);
            return u;
        });
        AuthResponse res = service.register(new RegisterRequest("Asha", " Asha@Farm.io ", "correct-horse", null, null));
        assertEquals("FARM_OWNER", res.user().role());
        assertEquals("asha@farm.io", res.user().email());
        assertEquals("Bearer", res.tokenType());
        assertFalse(res.token().isBlank());
        verify(users).save(argThat(u -> !u.getPasswordHash().equals("correct-horse") && u.getPasswordHash().startsWith("$2")));
    }

    @Test
    void registerRejectsPrivilegedRoles() {
        for (String role : new String[]{"ADMIN", "FARM_MANAGER", "AGRONOMIST", "NOPE"}) {
            assertThrows(BadRequestException.class,
                    () -> service.register(new RegisterRequest("A", "a@b.co", "password1", null, role)));
        }
        verify(users, never()).save(any());
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(users.existsByEmail("a@b.co")).thenReturn(true);
        assertThrows(ConflictException.class,
                () -> service.register(new RegisterRequest("A", "a@b.co", "password1", null, "FIELD_WORKER")));
    }

    @Test
    void loginSucceedsWithCorrectPassword() {
        when(users.findByEmail("asha@farm.io")).thenReturn(Optional.of(user(true)));
        assertEquals(3L, service.login(new LoginRequest("ASHA@farm.io", "correct-horse")).user().id());
    }

    @Test
    void loginFailsWithWrongPasswordOrUnknownEmail() {
        when(users.findByEmail("asha@farm.io")).thenReturn(Optional.of(user(true)));
        assertThrows(BadCredentialsException.class, () -> service.login(new LoginRequest("asha@farm.io", "wrong")));
        assertThrows(BadCredentialsException.class, () -> service.login(new LoginRequest("none@farm.io", "x")));
    }

    @Test
    void inactiveAccountCannotLogIn() {
        when(users.findByEmail("asha@farm.io")).thenReturn(Optional.of(user(false)));
        assertThrows(AccessDeniedException.class, () -> service.login(new LoginRequest("asha@farm.io", "correct-horse")));
    }
}

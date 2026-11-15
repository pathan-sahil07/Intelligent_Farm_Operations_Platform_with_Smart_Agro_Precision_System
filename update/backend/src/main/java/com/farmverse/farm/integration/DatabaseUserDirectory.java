package com.farmverse.farm.integration;

import com.farmverse.farm.user.AppUser;
import com.farmverse.farm.user.Roles;
import com.farmverse.farm.user.UserRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

/** UserDirectory backed by the real users table. */
@Component
public class DatabaseUserDirectory implements UserDirectory {
    private final UserRepository users;

    public DatabaseUserDirectory(UserRepository users) {
        this.users = users;
    }

    /** True for active staff accounts that may be assigned to a farm (workers, agronomists, managers). */
    @Override
    public boolean isFieldWorker(Long userId) {
        return userId != null && users.findById(userId)
                .filter(AppUser::isActive)
                .map(u -> Roles.ASSIGNABLE.contains(u.getRole()))
                .orElse(false);
    }

    @Override
    public Optional<String> displayName(Long userId) {
        return userId == null ? Optional.empty() : users.findById(userId).map(AppUser::getFullName);
    }
}

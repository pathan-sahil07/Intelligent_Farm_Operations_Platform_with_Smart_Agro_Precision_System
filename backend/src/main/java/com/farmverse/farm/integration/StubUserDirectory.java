package com.farmverse.farm.integration;

import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Temporary stand-in until Module 1 exists: accepts every user id.
 * DELETE this class once a real UserDirectory implementation is available.
 */
@Component
public class StubUserDirectory implements UserDirectory {

    @Override
    public boolean isFieldWorker(Long userId) {
        return userId != null && userId > 0;
    }

    @Override
    public Optional<String> displayName(Long userId) {
        return Optional.empty();
    }
}

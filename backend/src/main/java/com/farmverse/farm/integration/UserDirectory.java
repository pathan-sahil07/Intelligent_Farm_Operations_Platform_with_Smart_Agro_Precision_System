package com.farmverse.farm.integration;

import java.util.Optional;

/**
 * The only place Module 2 talks to Module 1 (User & Access).
 * When Module 1 is ready, implement this interface against its user service
 * and delete {@link StubUserDirectory}.
 */
public interface UserDirectory {

    /** True when the user exists and has the FIELD_WORKER role. */
    boolean isFieldWorker(Long userId);

    /** Display name of the user, if known. */
    Optional<String> displayName(Long userId);
}

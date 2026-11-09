package com.farmverse.farm.integration;

import java.util.Optional;

/**
 * Bridge from farm code to the user module; implemented by DatabaseUserDirectory.
 * Keep farm code decoupled from the user entities.
 */
public interface UserDirectory {

    /** True when the user is active and may be assigned to a farm as staff. */
    boolean isFieldWorker(Long userId);

    /** Display name of the user, if known. */
    Optional<String> displayName(Long userId);
}

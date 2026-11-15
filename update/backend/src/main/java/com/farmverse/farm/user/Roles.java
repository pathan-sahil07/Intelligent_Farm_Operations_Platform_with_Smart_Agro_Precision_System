package com.farmverse.farm.user;

import java.util.Set;

/** Role names used across the platform. */
public final class Roles {
    public static final String ADMIN = "ADMIN";
    public static final String FARM_OWNER = "FARM_OWNER";
    public static final String FARM_MANAGER = "FARM_MANAGER";
    public static final String AGRONOMIST = "AGRONOMIST";
    public static final String FIELD_WORKER = "FIELD_WORKER";

    public static final Set<String> ALL = Set.of(ADMIN, FARM_OWNER, FARM_MANAGER, AGRONOMIST, FIELD_WORKER);
    /** Roles a person may pick for themselves at self-registration. */
    public static final Set<String> SELF_REGISTRATION = Set.of(FARM_OWNER, FIELD_WORKER);
    /** Roles that may be attached to a farm as assigned staff. */
    public static final Set<String> ASSIGNABLE = Set.of(FARM_MANAGER, AGRONOMIST, FIELD_WORKER);

    private Roles() {
    }
}

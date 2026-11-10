package com.intelligentfarm.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Set;
import org.junit.jupiter.api.Test;

class RolePolicyTest {

    @Test
    void farmOwnerCanInviteOnlyNonOwnerRoles() {
        assertEquals(
                Set.of(FarmRole.FARM_MANAGER, FarmRole.FARMER, FarmRole.FIELD_WORKER),
                RolePolicy.invitationRolesFor(FarmRole.FARM_OWNER));
    }

    @Test
    void farmManagerCanInviteFarmerAndFieldWorkerButNotManager() {
        assertEquals(
                Set.of(FarmRole.FARMER, FarmRole.FIELD_WORKER),
                RolePolicy.invitationRolesFor(FarmRole.FARM_MANAGER));
    }

    @Test
    void farmersAndFieldWorkersCannotInvite() {
        assertEquals(Set.of(), RolePolicy.invitationRolesFor(FarmRole.FARMER));
        assertEquals(Set.of(), RolePolicy.invitationRolesFor(FarmRole.FIELD_WORKER));
    }
}

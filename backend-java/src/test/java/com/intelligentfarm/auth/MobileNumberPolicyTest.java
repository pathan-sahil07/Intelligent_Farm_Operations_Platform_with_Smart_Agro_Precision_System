package com.intelligentfarm.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class MobileNumberPolicyTest {

    @Test
    void acceptsCommonInternationalAndFormattedNumbers() {
        assertEquals(
                "+1 (555) 555-0123",
                MobileNumberPolicy.normalizeAndValidate("+1 (555) 555-0123", true));
        assertEquals(
                "+91 98765-43210",
                MobileNumberPolicy.normalizeAndValidate("+91 98765-43210", true));
    }

    @Test
    void rejectsMalformedNumbersAndMissingRequiredValues() {
        assertThrows(
                AuthService.ValidationException.class,
                () -> MobileNumberPolicy.normalizeAndValidate("not-a-number", true));
        assertThrows(
                AuthService.ValidationException.class,
                () -> MobileNumberPolicy.normalizeAndValidate(null, true));
    }

    @Test
    void permitsAbsentOptionalNumber() {
        assertNull(MobileNumberPolicy.normalizeAndValidate(null, false));
    }
}

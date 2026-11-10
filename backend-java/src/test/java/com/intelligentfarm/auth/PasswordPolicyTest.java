package com.intelligentfarm.auth;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class PasswordPolicyTest {

    @Test
    void acceptsPasswordMatchingRegistrationRequirements() {
        assertDoesNotThrow(() -> PasswordPolicy.validate("GoodPassword!123"));
    }

    @Test
    void rejectsPasswordMissingCharacterClasses() {
        assertThrows(
                AuthService.ValidationException.class,
                () -> PasswordPolicy.validate("alllowercase123"));
    }

    @Test
    void rejectsCommonPasswordAfterNormalization() {
        assertThrows(
                AuthService.ValidationException.class,
                () -> PasswordPolicy.validate("Password12345!"));
    }
}

package com.intelligentfarm.auth;

import java.util.Set;

final class PasswordPolicy {

    private static final Set<String> COMMON_PASSWORDS = Set.of(
            "password", "password123", "password1234", "password12345",
            "123456789012", "qwerty", "qwerty123", "qwerty123456",
            "letmein", "letmein123456", "welcome", "welcome123456",
            "admin", "admin123456", "iloveyou", "iloveyou12345",
            "abc123", "monkey", "dragon", "football", "sunshine");

    private PasswordPolicy() {
    }

    static void validate(String password) {
        if (password == null) {
            throw new AuthService.ValidationException("Password is required.");
        }
        int length = password.codePointCount(0, password.length());
        if (length < 12 || length > 1024) {
            throw new AuthService.ValidationException(
                    "Password must be between 12 and 1024 characters.");
        }
        boolean upper = password.codePoints().anyMatch(Character::isUpperCase);
        boolean lower = password.codePoints().anyMatch(Character::isLowerCase);
        boolean digit = password.codePoints().anyMatch(Character::isDigit);
        boolean special = password.codePoints().anyMatch(codePoint ->
                !Character.isLetterOrDigit(codePoint) && !Character.isWhitespace(codePoint));
        String normalized = password.toLowerCase(java.util.Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");
        if (!upper || !lower || !digit || !special || COMMON_PASSWORDS.contains(normalized)) {
            throw new AuthService.ValidationException(
                    "Password must include uppercase and lowercase letters, a number, and a special symbol, and must not be common.");
        }
    }
}

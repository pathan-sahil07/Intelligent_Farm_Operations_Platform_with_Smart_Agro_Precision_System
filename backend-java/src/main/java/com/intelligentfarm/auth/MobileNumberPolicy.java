package com.intelligentfarm.auth;

final class MobileNumberPolicy {

    private MobileNumberPolicy() {
    }

    static String normalizeAndValidate(String mobileNumber, boolean required) {
        if (mobileNumber == null || mobileNumber.isBlank()) {
            if (required) {
                throw new AuthService.ValidationException("Enter a valid contact number.");
            }
            return null;
        }
        String normalized = mobileNumber.trim();
        if (normalized.length() > 64) {
            throw new AuthService.ValidationException("Enter a valid contact number.");
        }
        String compact = normalized.replaceAll("[\\s\\-().]", "");
        String digits = compact.startsWith("+") ? compact.substring(1) : compact;
        if (!digits.matches("^[0-9]{10,14}$")) {
            throw new AuthService.ValidationException("Enter a valid contact number.");
        }
        return normalized;
    }
}

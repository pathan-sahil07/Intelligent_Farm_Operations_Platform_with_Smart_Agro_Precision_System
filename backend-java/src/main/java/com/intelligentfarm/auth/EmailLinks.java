package com.intelligentfarm.auth;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

final class EmailLinks {

    private EmailLinks() {
    }

    static String build(String baseUrl, String path, String token) {
        String normalizedBase = baseUrl.endsWith("/")
                ? baseUrl.substring(0, baseUrl.length() - 1)
                : baseUrl;
        return normalizedBase + path + "?token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);
    }
}

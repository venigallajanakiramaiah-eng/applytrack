package com.applytrack.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "test-secret-that-is-long-enough-0123456789";

    @Test
    void tokenRoundTripsUserId() {
        JwtService jwt = new JwtService(SECRET, 60);
        String token = jwt.generateToken(42L, "ram@example.com");

        assertThat(jwt.extractUserId(token)).contains(42L);
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        String token = new JwtService("another-secret-that-is-long-enough-987654", 60).generateToken(1L, "a@b.com");

        assertThat(new JwtService(SECRET, 60).extractUserId(token)).isEmpty();
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService jwt = new JwtService(SECRET, -1); // already expired when issued
        String token = jwt.generateToken(1L, "a@b.com");

        assertThat(jwt.extractUserId(token)).isEmpty();
    }

    @Test
    void garbageTokenIsRejected() {
        assertThat(new JwtService(SECRET, 60).extractUserId("abc.def.ghi")).isEmpty();
    }

    @Test
    void shortSecretFailsFast() {
        assertThatThrownBy(() -> new JwtService("too-short", 60)).isInstanceOf(IllegalStateException.class);
    }
}

package com.applytrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// We authenticate with our own JWT filter, so Spring's default in-memory user is not needed.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class ApplyTrackApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApplyTrackApplication.class, args);
    }
}

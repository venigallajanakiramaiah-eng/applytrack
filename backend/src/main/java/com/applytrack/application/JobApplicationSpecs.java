package com.applytrack.application;

import org.springframework.data.jpa.domain.Specification;

import java.util.Locale;

/** Composable query filters for the applications list. */
final class JobApplicationSpecs {

    private JobApplicationSpecs() {
    }

    static Specification<JobApplication> ownedBy(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }

    static Specification<JobApplication> hasStatus(ApplicationStatus status) {
        return (root, query, cb) -> status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }

    /** Case-insensitive search on company or role. */
    static Specification<JobApplication> matches(String text) {
        return (root, query, cb) -> {
            if (text == null || text.isBlank()) {
                return cb.conjunction();
            }
            String pattern = "%" + text.trim().toLowerCase(Locale.ROOT) + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("company")), pattern),
                    cb.like(cb.lower(root.get("role")), pattern));
        };
    }
}

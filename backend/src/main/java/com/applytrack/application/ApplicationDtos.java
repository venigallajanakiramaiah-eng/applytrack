package com.applytrack.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class ApplicationDtos {

    private ApplicationDtos() {
    }

    public record ApplicationRequest(
            @NotBlank @Size(max = 150) String company,
            @NotBlank @Size(max = 150) String role,
            @Size(max = 150) String location,
            @Size(max = 1000) @Pattern(regexp = "^$|^https?://.*", message = "must start with http:// or https://")
            String jobUrl,
            @NotNull ApplicationStatus status,
            @PastOrPresent LocalDate appliedDate,
            @Size(max = 4000) String notes) {
    }

    public record StatusUpdateRequest(@NotNull ApplicationStatus status) {
    }

    public record ApplicationResponse(
            Long id,
            String company,
            String role,
            String location,
            String jobUrl,
            ApplicationStatus status,
            LocalDate appliedDate,
            String notes,
            Instant createdAt,
            Instant updatedAt) {

        static ApplicationResponse from(JobApplication a) {
            return new ApplicationResponse(a.getId(), a.getCompany(), a.getRole(), a.getLocation(),
                    a.getJobUrl(), a.getStatus(), a.getAppliedDate(), a.getNotes(),
                    a.getCreatedAt(), a.getUpdatedAt());
        }
    }

    /** Stable JSON shape for paged results (instead of serializing Spring's PageImpl). */
    public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {
    }

    public record WeeklyCount(LocalDate weekStart, long count) {
    }

    public record StatsResponse(
            long total,
            Map<ApplicationStatus, Long> byStatus,
            long submitted,
            double responseRate,
            long appliedLast30Days,
            List<WeeklyCount> weekly) {
    }
}

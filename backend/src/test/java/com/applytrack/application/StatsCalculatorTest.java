package com.applytrack.application;

import com.applytrack.application.ApplicationDtos.StatsResponse;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class StatsCalculatorTest {

    // A Wednesday, so the current week starts on Monday 2026-11-09.
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 11);

    @Test
    void emptyDataGivesZeros() {
        StatsResponse stats = StatsCalculator.calculate(Map.of(), List.of(), TODAY);

        assertThat(stats.total()).isZero();
        assertThat(stats.responseRate()).isZero();
        assertThat(stats.byStatus()).hasSize(ApplicationStatus.values().length);
        assertThat(stats.weekly()).hasSize(StatsCalculator.WEEKS);
    }

    @Test
    void responseRateIgnoresSavedJobs() {
        Map<ApplicationStatus, Long> counts = Map.of(
                ApplicationStatus.SAVED, 10L,       // not submitted: excluded
                ApplicationStatus.APPLIED, 6L,
                ApplicationStatus.INTERVIEWING, 2L,
                ApplicationStatus.REJECTED, 2L);

        StatsResponse stats = StatsCalculator.calculate(counts, List.of(), TODAY);

        assertThat(stats.total()).isEqualTo(20);
        assertThat(stats.submitted()).isEqualTo(10);
        assertThat(stats.responseRate()).isEqualTo(40.0);
    }

    @Test
    void groupsAppliedDatesIntoWeeks() {
        List<LocalDate> dates = List.of(
                LocalDate.of(2026, 11, 9),   // this week (Monday)
                LocalDate.of(2026, 11, 11),  // this week (today)
                LocalDate.of(2026, 11, 8),   // last week (Sunday)
                LocalDate.of(2026, 9, 21),   // first week in the window
                LocalDate.of(2026, 9, 20));  // before the window: ignored

        StatsResponse stats = StatsCalculator.calculate(Map.of(), dates, TODAY);

        assertThat(stats.weekly().get(0).weekStart()).isEqualTo(LocalDate.of(2026, 9, 21));
        assertThat(stats.weekly().get(0).count()).isEqualTo(1);
        assertThat(stats.weekly().get(6).count()).isEqualTo(1);
        assertThat(stats.weekly().get(7).weekStart()).isEqualTo(LocalDate.of(2026, 11, 9));
        assertThat(stats.weekly().get(7).count()).isEqualTo(2);
        assertThat(stats.appliedLast30Days()).isEqualTo(3);
    }
}

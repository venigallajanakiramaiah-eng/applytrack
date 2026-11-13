package com.applytrack.application;

import com.applytrack.application.ApplicationDtos.StatsResponse;
import com.applytrack.application.ApplicationDtos.WeeklyCount;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/** Pure dashboard math, kept free of Spring/JPA so it is easy to unit test. */
public final class StatsCalculator {

    public static final int WEEKS = 8;

    private StatsCalculator() {
    }

    /** First day included in the weekly chart (Monday, WEEKS-1 weeks before the current week). */
    public static LocalDate windowStart(LocalDate today) {
        return currentWeekStart(today).minusWeeks(WEEKS - 1L);
    }

    public static StatsResponse calculate(Map<ApplicationStatus, Long> counts,
                                          Collection<LocalDate> appliedDates,
                                          LocalDate today) {
        Map<ApplicationStatus, Long> byStatus = new EnumMap<>(ApplicationStatus.class);
        for (ApplicationStatus s : ApplicationStatus.values()) {
            byStatus.put(s, counts.getOrDefault(s, 0L));
        }

        long total = 0;
        long submitted = 0;
        long responses = 0;
        for (Map.Entry<ApplicationStatus, Long> e : byStatus.entrySet()) {
            total += e.getValue();
            if (e.getKey().isSubmitted()) {
                submitted += e.getValue();
            }
            if (e.getKey().isResponse()) {
                responses += e.getValue();
            }
        }
        double responseRate = submitted == 0 ? 0.0 : Math.round(responses * 1000.0 / submitted) / 10.0;

        LocalDate last30Start = today.minusDays(29);
        long appliedLast30Days = appliedDates.stream()
                .filter(d -> !d.isBefore(last30Start) && !d.isAfter(today))
                .count();

        LocalDate firstWeek = windowStart(today);
        long[] buckets = new long[WEEKS];
        for (LocalDate d : appliedDates) {
            if (d.isBefore(firstWeek) || d.isAfter(today)) {
                continue;
            }
            int index = (int) (java.time.temporal.ChronoUnit.WEEKS.between(firstWeek, d));
            buckets[index]++;
        }
        List<WeeklyCount> weekly = new ArrayList<>(WEEKS);
        for (int i = 0; i < WEEKS; i++) {
            weekly.add(new WeeklyCount(firstWeek.plusWeeks(i), buckets[i]));
        }

        return new StatsResponse(total, byStatus, submitted, responseRate, appliedLast30Days, weekly);
    }

    private static LocalDate currentWeekStart(LocalDate today) {
        return today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }
}

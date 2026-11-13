package com.applytrack.application;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository
        extends JpaRepository<JobApplication, Long>, JpaSpecificationExecutor<JobApplication> {

    Optional<JobApplication> findByIdAndUserId(Long id, Long userId);

    /** Rows of [ApplicationStatus, Long count] for one user. */
    @Query("select a.status, count(a) from JobApplication a where a.user.id = :userId group by a.status")
    List<Object[]> countByStatus(@Param("userId") Long userId);

    @Query("select a.appliedDate from JobApplication a "
            + "where a.user.id = :userId and a.appliedDate is not null and a.appliedDate >= :since")
    List<LocalDate> findAppliedDatesSince(@Param("userId") Long userId, @Param("since") LocalDate since);
}

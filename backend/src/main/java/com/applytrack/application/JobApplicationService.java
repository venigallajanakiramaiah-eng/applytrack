package com.applytrack.application;

import com.applytrack.application.ApplicationDtos.ApplicationRequest;
import com.applytrack.application.ApplicationDtos.ApplicationResponse;
import com.applytrack.application.ApplicationDtos.PageResponse;
import com.applytrack.application.ApplicationDtos.StatsResponse;
import com.applytrack.common.NotFoundException;
import com.applytrack.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class JobApplicationService {

    static final int MAX_PAGE_SIZE = 100;

    private final JobApplicationRepository repository;
    private final UserRepository userRepository;
    private final Clock clock;

    public JobApplicationService(JobApplicationRepository repository, UserRepository userRepository, Clock clock) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<ApplicationResponse> list(Long userId, ApplicationStatus status, String query,
                                                  int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        var pageable = PageRequest.of(safePage, safeSize,
                Sort.by(Sort.Direction.DESC, "updatedAt").and(Sort.by(Sort.Direction.DESC, "id")));

        var spec = JobApplicationSpecs.ownedBy(userId)
                .and(JobApplicationSpecs.hasStatus(status))
                .and(JobApplicationSpecs.matches(query));

        Page<JobApplication> result = repository.findAll(spec, pageable);
        List<ApplicationResponse> content = result.getContent().stream().map(ApplicationResponse::from).toList();
        return new PageResponse<>(content, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public ApplicationResponse get(Long userId, Long id) {
        return ApplicationResponse.from(findOwned(userId, id));
    }

    @Transactional
    public ApplicationResponse create(Long userId, ApplicationRequest request) {
        JobApplication app = new JobApplication(userRepository.getReferenceById(userId));
        apply(app, request);
        return ApplicationResponse.from(repository.save(app));
    }

    @Transactional
    public ApplicationResponse update(Long userId, Long id, ApplicationRequest request) {
        JobApplication app = findOwned(userId, id);
        apply(app, request);
        return ApplicationResponse.from(repository.saveAndFlush(app));
    }

    @Transactional
    public ApplicationResponse updateStatus(Long userId, Long id, ApplicationStatus status) {
        JobApplication app = findOwned(userId, id);
        app.setStatus(status);
        if (status.isSubmitted() && app.getAppliedDate() == null) {
            app.setAppliedDate(LocalDate.now(clock));
        }
        return ApplicationResponse.from(repository.saveAndFlush(app));
    }

    @Transactional
    public void delete(Long userId, Long id) {
        repository.delete(findOwned(userId, id));
    }

    @Transactional(readOnly = true)
    public StatsResponse stats(Long userId) {
        Map<ApplicationStatus, Long> counts = new EnumMap<>(ApplicationStatus.class);
        for (Object[] row : repository.countByStatus(userId)) {
            counts.put((ApplicationStatus) row[0], (Long) row[1]);
        }
        LocalDate today = LocalDate.now(clock);
        List<LocalDate> dates = repository.findAppliedDatesSince(userId, StatsCalculator.windowStart(today));
        return StatsCalculator.calculate(counts, dates, today);
    }

    /** Looks up by id AND owner, so users can never read or change someone else's data. */
    private JobApplication findOwned(Long userId, Long id) {
        return repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Application " + id + " not found"));
    }

    private static void apply(JobApplication app, ApplicationRequest r) {
        app.setCompany(r.company().trim());
        app.setRole(r.role().trim());
        app.setLocation(blankToNull(r.location()));
        app.setJobUrl(blankToNull(r.jobUrl()));
        app.setStatus(r.status());
        app.setAppliedDate(r.appliedDate());
        app.setNotes(blankToNull(r.notes()));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

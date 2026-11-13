package com.applytrack.application;

import com.applytrack.application.ApplicationDtos.ApplicationRequest;
import com.applytrack.application.ApplicationDtos.ApplicationResponse;
import com.applytrack.application.ApplicationDtos.PageResponse;
import com.applytrack.application.ApplicationDtos.StatsResponse;
import com.applytrack.application.ApplicationDtos.StatusUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/applications")
public class JobApplicationController {

    private final JobApplicationService service;

    public JobApplicationController(JobApplicationService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<ApplicationResponse> list(@AuthenticationPrincipal Long userId,
                                                  @RequestParam(required = false) ApplicationStatus status,
                                                  @RequestParam(required = false) String q,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
        return service.list(userId, status, q, page, size);
    }

    @GetMapping("/stats")
    public StatsResponse stats(@AuthenticationPrincipal Long userId) {
        return service.stats(userId);
    }

    @GetMapping("/{id}")
    public ApplicationResponse get(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return service.get(userId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse create(@AuthenticationPrincipal Long userId,
                                      @Valid @RequestBody ApplicationRequest request) {
        return service.create(userId, request);
    }

    @PutMapping("/{id}")
    public ApplicationResponse update(@AuthenticationPrincipal Long userId, @PathVariable Long id,
                                      @Valid @RequestBody ApplicationRequest request) {
        return service.update(userId, id, request);
    }

    @PatchMapping("/{id}/status")
    public ApplicationResponse updateStatus(@AuthenticationPrincipal Long userId, @PathVariable Long id,
                                            @Valid @RequestBody StatusUpdateRequest request) {
        return service.updateStatus(userId, id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        service.delete(userId, id);
    }
}

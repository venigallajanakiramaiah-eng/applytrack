package com.applytrack.application;

import com.applytrack.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "job_applications", indexes = {
        @Index(name = "idx_job_applications_user_status", columnList = "user_id, status")
})
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String company;

    @Column(nullable = false, length = 150)
    private String role;

    @Column(length = 150)
    private String location;

    @Column(name = "job_url", length = 1000)
    private String jobUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationStatus status;

    @Column(name = "applied_date")
    private LocalDate appliedDate;

    @Column(length = 4000)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected JobApplication() {
        // required by JPA
    }

    public JobApplication(User user) {
        this.user = user;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getCompany() { return company; }
    public String getRole() { return role; }
    public String getLocation() { return location; }
    public String getJobUrl() { return jobUrl; }
    public ApplicationStatus getStatus() { return status; }
    public LocalDate getAppliedDate() { return appliedDate; }
    public String getNotes() { return notes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setCompany(String company) { this.company = company; }
    public void setRole(String role) { this.role = role; }
    public void setLocation(String location) { this.location = location; }
    public void setJobUrl(String jobUrl) { this.jobUrl = jobUrl; }
    public void setStatus(ApplicationStatus status) { this.status = status; }
    public void setAppliedDate(LocalDate appliedDate) { this.appliedDate = appliedDate; }
    public void setNotes(String notes) { this.notes = notes; }
}

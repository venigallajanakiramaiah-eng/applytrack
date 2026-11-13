package com.applytrack.application;

/** The stages an application moves through. */
public enum ApplicationStatus {
    SAVED,          // found the job, not applied yet
    APPLIED,
    INTERVIEWING,   // any screen / online assessment / interview round
    OFFER,
    REJECTED,
    WITHDRAWN;

    /** True once the application has actually been sent. */
    public boolean isSubmitted() {
        return this != SAVED;
    }

    /** True when the employer has replied in some way. */
    public boolean isResponse() {
        return this == INTERVIEWING || this == OFFER || this == REJECTED;
    }
}

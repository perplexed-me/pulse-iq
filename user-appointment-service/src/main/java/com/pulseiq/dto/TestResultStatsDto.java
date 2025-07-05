package com.pulseiq.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TestResultStatsDto {
    
    private long totalTests;
    private long completedTests;
    private long pendingTests;
    private long reviewedTests;
    private long cancelledTests;
    private String mostFrequentTestType;
    private long testsThisMonth;
    private long testsThisYear;
}

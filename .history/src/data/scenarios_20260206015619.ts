export const scenarios = [
    {
        id: "new_account_withdrawals",
        name: "New account with frequent withdrawals",
        date: "2024-02-12",
        risk: "High",
        data: {
            account_age_days: 3,
            withdrawal_attempts: 4,
            geo_switches: 1,
            profile_changes: 3,
        },
        visualizationData: {
            history: [
                { day: "Day 1", score: 20 },
                { day: "Day 2", score: 45 },
                { day: "Day 3", score: 85 },
            ],
            breakdown: [
                { signal: "Age", impact: 30 },
                { signal: "Withdrawals", impact: 40 },
                { signal: "Profile", impact: 15 },
                { signal: "Geo", impact: 5 },
            ],
        },
    },
    {
        id: "geo_switching",
        name: "Rapid geo-location switching",
        date: "2024-02-11",
        risk: "Medium",
        data: {
            account_age_days: 45,
            withdrawal_attempts: 1,
            geo_switches: 3,
            profile_changes: 0,
        },
        visualizationData: {
            history: [
                { day: "Day 1", score: 10 },
                { day: "Day 2", score: 15 },
                { day: "Day 3", score: 65 },
            ],
            breakdown: [
                { signal: "Geo", impact: 60 },
                { signal: "Age", impact: 5 },
                { signal: "Withdrawals", impact: 10 },
            ],
        },
    },
    {
        id: "normal_user",
        name: "Normal stable user",
        date: "2024-02-10",
        risk: "Low",
        data: {
            account_age_days: 180,
            withdrawal_attempts: 0,
            geo_switches: 0,
            profile_changes: 0,
        },
        visualizationData: {
            history: [
                { day: "Day 1", score: 5 },
                { day: "Day 2", score: 5 },
                { day: "Day 3", score: 10 },
            ],
            breakdown: [
                { signal: "Age", impact: 0 },
                { signal: "Geo", impact: 5 },
            ],
        },
    },
    {
        id: "velocity_check",
        name: "High velocity transaction volume",
        date: "2024-02-14",
        risk: "Medium",
        data: {
            account_age_days: 120,
            withdrawal_attempts: 8,
            geo_switches: 0,
            profile_changes: 0,
        },
        visualizationData: {
            history: [
                { day: "Day 1", score: 20 },
                { day: "Day 2", score: 30 },
                { day: "Day 3", score: 55 },
            ],
            breakdown: [
                { signal: "Withdrawals", impact: 70 },
                { signal: "Age", impact: 5 },
            ],
        },
    },
    {
        id: "account_takeover",
        name: "Potential Account Takeover",
        date: "2024-02-14",
        risk: "High",
        data: {
            account_age_days: 365,
            withdrawal_attempts: 5,
            geo_switches: 4,
            profile_changes: 2,
        },
        visualizationData: {
            history: [
                { day: "Day 1", score: 10 },
                { day: "Day 2", score: 10 },
                { day: "Day 3", score: 92 },
            ],
            breakdown: [
                { signal: "Geo", impact: 40 },
                { signal: "Withdrawals", impact: 30 },
                { signal: "Profile", impact: 20 },
            ],
        },
    },
    {
        id: "policy_violation_kyc",
        name: "KYC Document Mismatch",
        date: "2024-02-13",
        risk: "High",
        data: {
            account_age_days: 1,
            withdrawal_attempts: 0,
            geo_switches: 1,
            profile_changes: 5,
        },
        visualizationData: {
            history: [
                { day: "Day 1", score: 80 },
                { day: "Day 2", score: 80 },
                { day: "Day 3", score: 80 },
            ],
            breakdown: [
                { signal: "Profile", impact: 80 },
                { signal: "Age", impact: 10 },
            ],
        },
    },
    {
        id: "dormant_reactivation",
        name: "Dormant Account Reactivation",
        date: "2024-02-09",
        risk: "Low",
        data: {
            account_age_days: 700,
            withdrawal_attempts: 1,
            geo_switches: 0,
            profile_changes: 0,
        },
        visualizationData: {
            history: [
                { day: "Day 1", score: 0 },
                { day: "Day 2", score: 0 },
                { day: "Day 3", score: 25 },
            ],
            breakdown: [
                { signal: "Withdrawals", impact: 20 },
                { signal: "Age", impact: 5 },
            ],
        },
    },
];

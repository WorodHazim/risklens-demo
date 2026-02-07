export const scenarios = [
    {
        id: "new_account_withdrawals",
        name: "New account with frequent withdrawals",
        date: "2024-02-12",
        risk: "High",
        riskScore: 85,
        explanation: "Critical risk detected: New account (3 days) with multiple withdrawal attempts (4) suggests potential account compromise or immediate fraud mission.",
        recommended_action: "Escalate",
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
        riskScore: 65,
        explanation: "Anomalous behavioral vector: 3 distinct geo-switches within 48h indicates a deviation from user baseline, typical of credential sharing or VPN exit-node hopping.",
        recommended_action: "Request Verification",
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
        riskScore: 12,
        explanation: "User behavior falls within established normal operating parameters. 180-day account stability and zero anomalous signals support a low risk classification.",
        recommended_action: "Monitor",
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
        riskScore: 58,
        explanation: "Velocity threshold warning: 8 withdrawal attempts by an established user (120 days) warrants verification to confirm intent vs scripted bot activity.",
        recommended_action: "Request Verification",
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
        riskScore: 92,
        explanation: "High-probability takeover: Concurrent geo-switches (4) and profile edits (2) followed by withdrawals (5) matches a known ATO signature.",
        recommended_action: "Escalate",
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
        riskScore: 78,
        explanation: "Policy non-compliance: Excessive profile edits (5) on a day-1 account indicates an attempt to bypass initial KYC screening protocols.",
        recommended_action: "Escalate",
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
        riskScore: 24,
        explanation: "Standard reactivation: Passive monitor recommended. First activity after a 700-day dormancy period is within normal volume thresholds.",
        recommended_action: "Monitor",
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

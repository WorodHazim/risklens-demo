export const scenarios = [
  {
    id: "new_account_withdrawals",
    name: "New account with frequent withdrawals",
    data: {
      account_age_days: 3,
      withdrawal_attempts: 4,
      geo_switches: 1,
      profile_changes: 3,
    },
  },
  {
    id: "geo_switching",
    name: "Rapid geo-location switching",
    data: {
      account_age_days: 45,
      withdrawal_attempts: 1,
      geo_switches: 3,
      profile_changes: 0,
    },
  },
  {
    id: "normal_user",
    name: "Normal stable user",
    data: {
      account_age_days: 180,
      withdrawal_attempts: 0,
      geo_switches: 0,
      profile_changes: 0,
    },
  },
];

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    account_age_days = 0,
    withdrawal_attempts = 0,
    geo_switches = 0,
    profile_changes = 0,
  } = body ?? {};

  let risk_level: "Low" | "Medium" | "High" = "Low";
  const risk_signals: string[] = [];
  let recommended_action: "Monitor" | "Request verification" | "Escalate" = "Monitor";

  if (account_age_days < 7 && withdrawal_attempts >= 3) {
    risk_level = "High";
    risk_signals.push("New account with multiple withdrawal attempts");
    recommended_action = "Escalate";
  }

  if (geo_switches >= 2) {
    risk_level = risk_level === "High" ? "High" : "Medium";
    risk_signals.push("Rapid geo-location switching");
    if (risk_level === "Medium") recommended_action = "Request verification";
  }

  if (profile_changes >= 3) {
    risk_signals.push("Frequent profile information changes");
  }
  // --- Advanced risk heuristics ---

// Early sensitive activity across multiple dimensions
if (account_age_days < 30 && geo_switches >= 1 && withdrawal_attempts >= 1) {
  risk_level = "High";
  risk_signals.push(
    "Sensitive activity detected early in the account lifecycle across multiple indicators"
  );
  recommended_action = "Escalate";
}

// Concurrent risky behavior (profile + money)
if (withdrawal_attempts >= 2 && profile_changes >= 2) {
  if (risk_level === "Low") {
    risk_level = "Medium";
    recommended_action = "Request verification";
  }
  risk_signals.push(
    "Concurrent profile changes and withdrawal attempts detected"
  );
}

// Trust-building behavior (risk reduction)
if (
  account_age_days > 180 &&
  withdrawal_attempts === 0 &&
  geo_switches === 0 &&
  profile_changes === 0
) {
  risk_signals.push("Long-term stable and consistent behavior observed");
  if (risk_level !== "High") {
    risk_level = "Low";
    recommended_action = "Monitor";
  }
}

// Sudden change after stability
if (account_age_days > 90 && geo_switches >= 2) {
  if (risk_level === "Low") {
    risk_level = "Medium";
    recommended_action = "Request verification";
  }
  risk_signals.push(
    "Sudden behavioral change detected after a period of stability"
  );
}


  const explanation =
    risk_level === "High"
      ? "This behavior is considered high risk because it shows unusual activity early in the account lifecycle combined with repeated sensitive actions."
      : risk_level === "Medium"
      ? "This behavior shows some unusual patterns that may require additional verification."
      : "This behavior matches normal usage patterns with no significant risk indicators.";

  return NextResponse.json({
    risk_level,
    risk_signals,
    explanation,
    recommended_action,
  });
}

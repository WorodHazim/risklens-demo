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

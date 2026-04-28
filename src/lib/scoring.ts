// Scoring logic for zkfync Base Wallet Score.
// Pure functions — no I/O. Easy to extract into an API later.

export type Tier = "diamond" | "platinum" | "gold" | "silver" | "bronze" | "none";

export interface WalletMetrics {
  tx_count: number;
  contract_count: number;
  active_months: number;
  active_days: number;
  native_volume_eth: number;
  gasfee_eth: number;
  current_balance_eth: number;
}

export interface ScoreBreakdown {
  txScore: number;
  contractScore: number;
  monthsScore: number;
  daysScore: number;
  volumeScore: number;
  gasScore: number;
}

export interface ScoreResult {
  metrics: WalletMetrics;
  breakdown: ScoreBreakdown;
  score: number;
  tier: Tier;
  eligible: boolean;
  eligibility: {
    contract_count: boolean;
    tx_count: boolean;
    active_months: boolean;
    native_volume_eth: boolean;
  };
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function computeBreakdown(m: WalletMetrics): ScoreBreakdown {
  return {
    txScore: Math.min(m.tx_count / 200, 1) * 220,
    contractScore: Math.min(m.contract_count / 30, 1) * 220,
    monthsScore: Math.min(m.active_months / 12, 1) * 200,
    daysScore: Math.min(m.active_days / 120, 1) * 140,
    volumeScore: Math.min(m.native_volume_eth / 5, 1) * 140,
    gasScore: Math.min(m.gasfee_eth / 0.5, 1) * 80,
  };
}

export function computeScore(m: WalletMetrics): number {
  const b = computeBreakdown(m);
  const sum = b.txScore + b.contractScore + b.monthsScore + b.daysScore + b.volumeScore + b.gasScore;
  return clamp(Math.round(sum), 0, 1000);
}

export function tierForScore(score: number): Tier {
  if (score >= 900) return "diamond";
  if (score >= 750) return "platinum";
  if (score >= 550) return "gold";
  if (score >= 350) return "silver";
  if (score >= 150) return "bronze";
  return "none";
}

export function checkEligibility(m: WalletMetrics) {
  const eligibility = {
    contract_count: m.contract_count >= 5,
    tx_count: m.tx_count >= 10,
    active_months: m.active_months >= 3,
    native_volume_eth: m.native_volume_eth >= 0.01,
  };
  return {
    eligibility,
    eligible: Object.values(eligibility).every(Boolean),
  };
}

export function buildResult(metrics: WalletMetrics): ScoreResult {
  const breakdown = computeBreakdown(metrics);
  const score = computeScore(metrics);
  const tier = tierForScore(score);
  const { eligibility, eligible } = checkEligibility(metrics);
  return { metrics, breakdown, score, tier, eligible, eligibility };
}

export const TIER_LABEL: Record<Tier, string> = {
  diamond: "Diamond",
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
  none: "Unranked",
};

export const TIER_THRESHOLDS: Array<{ tier: Tier; min: number }> = [
  { tier: "diamond", min: 900 },
  { tier: "platinum", min: 750 },
  { tier: "gold", min: 550 },
  { tier: "silver", min: 350 },
  { tier: "bronze", min: 150 },
];

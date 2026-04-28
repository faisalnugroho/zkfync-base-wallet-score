import type { ScoreResult } from "./scoring";

const TTL_MS = 5 * 60 * 1000;
const PREFIX = "zkfync:wallet:";
const LB_KEY = "zkfync:leaderboard";
const LB_MAX = 50;

export interface LeaderboardEntry {
  address: string;
  score: number;
  tier: string;
  eligible: boolean;
  ts: number;
}

export function getCached(address: string): ScoreResult | null {
  try {
    const raw = localStorage.getItem(PREFIX + address.toLowerCase());
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > TTL_MS) return null;
    return data as ScoreResult;
  } catch {
    return null;
  }
}

export function setCached(address: string, data: ScoreResult) {
  try {
    localStorage.setItem(
      PREFIX + address.toLowerCase(),
      JSON.stringify({ ts: Date.now(), data }),
    );
  } catch {
    /* ignore */
  }
}

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function pushLeaderboard(entry: LeaderboardEntry) {
  try {
    const list = getLeaderboard().filter(
      (e) => e.address.toLowerCase() !== entry.address.toLowerCase(),
    );
    list.unshift(entry);
    const trimmed = list.slice(0, LB_MAX);
    localStorage.setItem(LB_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

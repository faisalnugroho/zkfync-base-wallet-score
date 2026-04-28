import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Share2, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletInput } from "@/components/WalletInput";
import { ScoreRing } from "@/components/ScoreRing";
import { TierBadge } from "@/components/TierBadge";
import { EligibilityBadge } from "@/components/EligibilityBadge";
import { StatsGrid } from "@/components/StatsGrid";
import { checkWallet } from "@/lib/blockscout";
import { TIER_LABEL, type ScoreResult } from "@/lib/scoring";
import { getCached, setCached, pushLeaderboard, getLeaderboard, type LeaderboardEntry } from "@/lib/cache";
import { notifyReady, shareCast } from "@/lib/farcaster";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [address, setAddress] = useState<string>("");
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    notifyReady();
    setBoard(getLeaderboard());
  }, []);

  const handleCheck = async (addr: string) => {
    setAddress(addr);
    const cached = getCached(addr);
    if (cached) {
      setResult(cached);
      toast.success("Loaded from cache", { description: "Refreshes after 5 minutes." });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await checkWallet(addr);
      setResult(res);
      setCached(addr, res);
      pushLeaderboard({
        address: addr,
        score: res.score,
        tier: res.tier,
        eligible: res.eligible,
        ts: Date.now(),
      });
      setBoard(getLeaderboard());
      toast.success(`Score: ${res.score} — ${TIER_LABEL[res.tier]}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (msg === "RATE_LIMIT") {
        toast.error("Rate limited", { description: "Try again in a moment." });
      } else {
        toast.error("Failed to fetch wallet", { description: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!result) return;
    const text = `My zkfync Base Wallet Score: ${result.score} (${TIER_LABEL[result.tier]})${
      result.eligible ? " — Top 2.5M ✅" : ""
    }`;
    shareCast(text, window.location.origin);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden />

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto px-5 pt-6 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-glow grid place-items-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">zkfync</span>
        </a>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
          Base Mainnet
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-5 pt-16 pb-24">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border glass text-xs text-muted-foreground mb-6">
            <Sparkles className="h-3 w-3 text-primary" />
            On-chain reputation, instantly
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight">
            <span className="text-gradient">zkfync</span> Base Wallet Score
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Built by zkfync — Check your Base wallet activity instantly. Score 0–1000, tier,
            and Top 2.5M eligibility.
          </p>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <WalletInput onSubmit={handleCheck} loading={loading} defaultValue={address} />
        </motion.div>

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-16 flex flex-col items-center gap-4">
            <div className="h-[280px] w-[280px] rounded-full border border-border glass animate-pulse-glow grid place-items-center">
              <span className="text-muted-foreground text-sm">Reading on-chain history…</span>
            </div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-16 grid lg:grid-cols-[auto,1fr] gap-10 items-start"
          >
            <div className="flex flex-col items-center gap-5 mx-auto lg:mx-0">
              <ScoreRing score={result.score} tier={result.tier} />
              <TierBadge tier={result.tier} large />
              <Button
                onClick={handleShare}
                variant="outline"
                className="border-primary/40 hover:bg-primary/10"
              >
                <Share2 className="h-4 w-4 mr-2" /> Share on Farcaster
              </Button>
              <p className="text-xs text-muted-foreground font-mono">{short(address)}</p>
            </div>

            <div className="space-y-6">
              <EligibilityBadge result={result} />
              <StatsGrid metrics={result.metrics} />
            </div>
          </motion.section>
        )}

        {/* Leaderboard */}
        {board.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-24"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold tracking-tight">Recent checks</h2>
              <span className="text-xs text-muted-foreground">(local · top 10 of 50)</span>
            </div>
            <div className="glass rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-secondary/40">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">#</th>
                    <th className="text-left px-4 py-3 font-medium">Wallet</th>
                    <th className="text-right px-4 py-3 font-medium">Score</th>
                    <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Tier</th>
                    <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Top 2.5M</th>
                  </tr>
                </thead>
                <tbody>
                  {board.slice(0, 10).map((e, i) => (
                    <tr
                      key={e.address + e.ts}
                      className="border-t border-border hover:bg-secondary/30 cursor-pointer transition-colors"
                      onClick={() => handleCheck(e.address)}
                    >
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs">{short(e.address)}</td>
                      <td className="px-4 py-3 text-right font-display font-semibold tabular-nums">
                        {e.score}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell capitalize text-muted-foreground">
                        {e.tier}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        {e.eligible ? "✅" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border mt-10">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            Built by <span className="text-foreground font-semibold">zkfync</span>
          </p>
          <p className="text-center sm:text-right">
            Not affiliated with Base or Coinbase. Data may be delayed.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

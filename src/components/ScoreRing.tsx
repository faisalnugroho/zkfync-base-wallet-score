import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Tier } from "@/lib/scoring";

const TIER_GLOW: Record<Tier, string> = {
  diamond: "hsl(var(--tier-diamond))",
  platinum: "hsl(var(--tier-platinum))",
  gold: "hsl(var(--tier-gold))",
  silver: "hsl(var(--tier-silver))",
  bronze: "hsl(var(--tier-bronze))",
  none: "hsl(var(--tier-none))",
};

interface Props {
  score: number;
  tier: Tier;
}

export function ScoreRing({ score, tier }: Props) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    cancelAnimationFrame(rafRef.current!);
    const start = performance.now();
    const from = display;
    const to = score;
    const dur = 1400;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const pct = Math.max(0, Math.min(1, score / 1000));
  const size = 280;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const glow = TIER_GLOW[tier];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl opacity-50"
        style={{ background: glow }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg width={size} height={size} className="-rotate-90 relative">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(var(--secondary))"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - dash }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Score</span>
        <span className="font-display text-7xl font-bold text-gradient tabular-nums leading-none mt-1">
          {display}
        </span>
        <span className="text-xs text-muted-foreground mt-2">/ 1000</span>
      </div>
    </div>
  );
}

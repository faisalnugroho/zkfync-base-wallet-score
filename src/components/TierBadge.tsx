import { motion } from "framer-motion";
import { Diamond, Award, Medal, Shield, Trophy } from "lucide-react";
import type { Tier } from "@/lib/scoring";
import { TIER_LABEL } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const ICONS: Record<Tier, React.ComponentType<{ className?: string }>> = {
  diamond: Diamond,
  platinum: Trophy,
  gold: Award,
  silver: Medal,
  bronze: Shield,
  none: Shield,
};

const STYLES: Record<Tier, string> = {
  diamond: "border-tier-diamond/40 text-tier-diamond bg-tier-diamond/10",
  platinum: "border-tier-platinum/40 text-tier-platinum bg-tier-platinum/10",
  gold: "border-tier-gold/40 text-tier-gold bg-tier-gold/10",
  silver: "border-tier-silver/40 text-tier-silver bg-tier-silver/10",
  bronze: "border-tier-bronze/40 text-tier-bronze bg-tier-bronze/10",
  none: "border-tier-none/40 text-tier-none bg-tier-none/10",
};

export function TierBadge({ tier, large = false }: { tier: Tier; large?: boolean }) {
  const Icon = ICONS[tier];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border backdrop-blur-sm font-medium",
        STYLES[tier],
        large ? "px-5 py-2 text-sm" : "px-3 py-1 text-xs",
      )}
    >
      <Icon className={large ? "h-4 w-4" : "h-3.5 w-3.5"} />
      <span className="uppercase tracking-wider">{TIER_LABEL[tier]} Tier</span>
    </motion.div>
  );
}

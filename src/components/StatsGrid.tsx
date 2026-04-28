import { motion } from "framer-motion";
import {
  Activity,
  Boxes,
  CalendarDays,
  CalendarRange,
  Coins,
  Flame,
  Wallet,
} from "lucide-react";
import type { WalletMetrics } from "@/lib/scoring";

const fmtEth = (n: number) =>
  n >= 1 ? n.toFixed(3) : n >= 0.001 ? n.toFixed(4) : n.toExponential(2);

interface Stat {
  label: string;
  value: string;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function StatsGrid({ metrics }: { metrics: WalletMetrics }) {
  const stats: Stat[] = [
    { label: "Transactions", value: metrics.tx_count.toLocaleString(), icon: Activity },
    { label: "Contracts", value: metrics.contract_count.toLocaleString(), icon: Boxes },
    { label: "Active months", value: metrics.active_months.toString(), icon: CalendarRange },
    { label: "Active days", value: metrics.active_days.toString(), icon: CalendarDays },
    { label: "Native volume", value: fmtEth(metrics.native_volume_eth), suffix: "ETH", icon: Coins },
    { label: "Gas spent", value: fmtEth(metrics.gasfee_eth), suffix: "ETH", icon: Flame },
    { label: "Balance", value: fmtEth(metrics.current_balance_eth), suffix: "ETH", icon: Wallet },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i + 0.2, duration: 0.4 }}
          className="glass rounded-2xl border border-border p-4 hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-semibold tabular-nums">{s.value}</span>
            {s.suffix && <span className="text-xs text-muted-foreground">{s.suffix}</span>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

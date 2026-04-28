import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import type { ScoreResult } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const LABELS: Record<keyof ScoreResult["eligibility"], string> = {
  contract_count: "≥ 5 contracts interacted",
  tx_count: "≥ 10 transactions",
  active_months: "≥ 3 active months",
  native_volume_eth: "≥ 0.01 ETH volume",
};

export function EligibilityBadge({ result }: { result: ScoreResult }) {
  const { eligible, eligibility } = result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={cn(
        "glass rounded-2xl border p-5 w-full",
        eligible ? "border-primary/40" : "border-border",
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        {eligible ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <XCircle className="h-5 w-5 text-muted-foreground" />
        )}
        <h3 className="font-display font-semibold">
          {eligible ? "Top 2.5M Eligible" : "Not yet eligible"}
        </h3>
      </div>
      <ul className="space-y-1.5 text-sm">
        {(Object.keys(LABELS) as Array<keyof typeof LABELS>).map((k) => (
          <li key={k} className="flex items-center gap-2">
            {eligibility[k] ? (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className={eligibility[k] ? "text-foreground" : "text-muted-foreground"}>
              {LABELS[k]}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

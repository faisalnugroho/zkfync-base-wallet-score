import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidAddress } from "@/lib/blockscout";

const schema = z.object({
  address: z
    .string()
    .trim()
    .refine(isValidAddress, "Enter a valid 0x… Base wallet address"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (address: string) => void;
  loading?: boolean;
  defaultValue?: string;
}

export function WalletInput({ onSubmit, loading, defaultValue = "" }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { address: defaultValue },
    mode: "onSubmit",
  });

  return (
    <form
      onSubmit={form.handleSubmit((v) => onSubmit(v.address.trim()))}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="glass rounded-2xl border border-border p-2 flex flex-col sm:flex-row gap-2 shadow-card">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            {...form.register("address")}
            placeholder="0x… your Base wallet address"
            autoComplete="off"
            spellCheck={false}
            className="pl-11 h-12 bg-transparent border-0 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-label="Base wallet address"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="h-12 px-6 bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-semibold shadow-elegant"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Scoring…
            </>
          ) : (
            "Check Score"
          )}
        </Button>
      </div>
      {form.formState.errors.address && (
        <p className="mt-2 text-sm text-destructive ml-2">
          {form.formState.errors.address.message}
        </p>
      )}
    </form>
  );
}

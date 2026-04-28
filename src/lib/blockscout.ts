// Blockscout API client for Base mainnet. No API key required.
// Etherscan-compatible endpoints exposed at /api?module=...&action=...

import { buildResult, type ScoreResult, type WalletMetrics } from "./scoring";

const BASE_URL = "https://base.blockscout.com/api";
const WEI = 1e18;

interface RpcResp<T> {
  status: string;
  message: string;
  result: T;
}

async function call<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(BASE_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (res.status === 429) {
    throw new Error("RATE_LIMIT");
  }
  if (!res.ok) throw new Error(`Blockscout error ${res.status}`);
  const data = (await res.json()) as RpcResp<T>;
  // "No transactions found" is success with empty array
  if (data.status === "0" && /no transactions found/i.test(String(data.message))) {
    return [] as unknown as T;
  }
  if (data.status === "0" && data.message && data.message !== "OK") {
    // Some empty results return status 0 with empty result string
    if (!data.result || (Array.isArray(data.result) && data.result.length === 0)) {
      return [] as unknown as T;
    }
  }
  return data.result;
}

export interface Tx {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  timeStamp: string;
  isError?: string;
  contractAddress?: string;
  input?: string;
}

export interface InternalTx {
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  contractAddress?: string;
  type?: string;
}

export const isValidAddress = (addr: string) =>
  /^0x[a-fA-F0-9]{40}$/.test(addr.trim());

export async function fetchWalletData(address: string) {
  const addr = address.toLowerCase();
  const [balanceRaw, txList, internalList] = await Promise.all([
    call<string>({ module: "account", action: "balance", address: addr }),
    call<Tx[]>({
      module: "account",
      action: "txlist",
      address: addr,
      sort: "asc",
      startblock: "0",
      endblock: "99999999",
      page: "1",
      offset: "10000",
    }),
    call<InternalTx[]>({
      module: "account",
      action: "txlistinternal",
      address: addr,
      sort: "asc",
      startblock: "0",
      endblock: "99999999",
      page: "1",
      offset: "10000",
    }),
  ]);

  return {
    balance: balanceRaw ?? "0",
    txs: Array.isArray(txList) ? txList : [],
    internals: Array.isArray(internalList) ? internalList : [],
  };
}

function computeMetrics(
  address: string,
  balance: string,
  txs: Tx[],
  internals: InternalTx[],
): WalletMetrics {
  const me = address.toLowerCase();
  const current_balance_eth = Number(balance) / WEI;

  const tx_count = txs.length;

  const contracts = new Set<string>();
  for (const t of txs) {
    // Heuristic: tx with non-empty input and a `to` is a contract interaction
    const to = (t.to || "").toLowerCase();
    const hasInput = t.input && t.input !== "0x" && t.input.length > 2;
    if (to && hasInput) contracts.add(to);
    if (t.contractAddress) contracts.add(t.contractAddress.toLowerCase());
  }
  const contract_count = contracts.size;

  // Activity windows
  const days = new Set<string>();
  const months = new Set<string>();
  for (const t of txs) {
    const ts = Number(t.timeStamp) * 1000;
    if (!ts) continue;
    const d = new Date(ts);
    const ymd = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    const ym = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    days.add(ymd);
    months.add(ym);
  }
  const active_days = days.size;
  const active_months = months.size;

  // Native volume = sum of value sent OR received via external + internal txs
  let volumeWei = 0;
  for (const t of txs) {
    const v = Number(t.value || 0);
    if (!Number.isFinite(v)) continue;
    if ((t.from || "").toLowerCase() === me || (t.to || "").toLowerCase() === me) {
      volumeWei += v;
    }
  }
  for (const t of internals) {
    const v = Number(t.value || 0);
    if (!Number.isFinite(v)) continue;
    if ((t.from || "").toLowerCase() === me || (t.to || "").toLowerCase() === me) {
      volumeWei += v;
    }
  }
  const native_volume_eth = volumeWei / WEI;

  // Gas fees only for outgoing txs (sender pays)
  let gasWei = 0;
  for (const t of txs) {
    if ((t.from || "").toLowerCase() !== me) continue;
    const used = Number(t.gasUsed || 0);
    const price = Number(t.gasPrice || 0);
    if (Number.isFinite(used) && Number.isFinite(price)) {
      gasWei += used * price;
    }
  }
  const gasfee_eth = gasWei / WEI;

  return {
    tx_count,
    contract_count,
    active_months,
    active_days,
    native_volume_eth,
    gasfee_eth,
    current_balance_eth,
  };
}

export async function checkWallet(address: string): Promise<ScoreResult> {
  const { balance, txs, internals } = await fetchWalletData(address);
  const metrics = computeMetrics(address, balance, txs, internals);
  return buildResult(metrics);
}

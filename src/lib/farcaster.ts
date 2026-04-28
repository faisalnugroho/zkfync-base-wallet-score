// Thin wrapper around @farcaster/miniapp-sdk with safe fallbacks for the web.
import { sdk } from "@farcaster/miniapp-sdk";

let _isMini: boolean | null = null;

export async function isMiniApp(): Promise<boolean> {
  if (_isMini !== null) return _isMini;
  try {
    _isMini = await sdk.isInMiniApp();
  } catch {
    _isMini = false;
  }
  return _isMini;
}

export async function notifyReady() {
  try {
    if (await isMiniApp()) await sdk.actions.ready();
  } catch {
    /* ignore */
  }
}

export async function shareCast(text: string, url: string) {
  if (await isMiniApp()) {
    try {
      await sdk.actions.composeCast({ text, embeds: [url] });
      return;
    } catch {
      /* fall through */
    }
  }
  const intent = `https://warpcast.com/~/compose?text=${encodeURIComponent(
    text,
  )}&embeds[]=${encodeURIComponent(url)}`;
  window.open(intent, "_blank", "noopener,noreferrer");
}

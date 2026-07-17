/**
 * Short-lived in-memory cache for active network rows.
 * Cuts one MySQL RTT per redeem quote / selection when the same slug is reused.
 */

type NetworkRow = { id: string; slug: string };

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: NetworkRow | null; expiresAt: number }>();

export function getCachedActiveNetwork(slug: string): NetworkRow | null | undefined {
  const key = slug.trim().toLowerCase();
  if (!key) return null;
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

export function setCachedActiveNetwork(slug: string, value: NetworkRow | null): void {
  const key = slug.trim().toLowerCase();
  if (!key) return;
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

/** Test helper */
export function clearActiveNetworkCache(): void {
  cache.clear();
}

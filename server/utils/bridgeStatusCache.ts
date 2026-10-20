import axios from "axios";

/** Fresh window: return cache without hitting Trade. */
const TTL_MS = 20_000;
/** Serve stale while a background refresh runs. */
const STALE_MS = 90_000;

let cache: { at: number; data: unknown } | null = null;
let inflight: Promise<unknown> | null = null;

async function fetchBridgeStatus(tradeBase: string): Promise<unknown> {
    const response = await axios.get(`${tradeBase}/bridge/status`, { timeout: 15000 });
    cache = { at: Date.now(), data: response.data };
    return response.data;
}

function refresh(tradeBase: string): Promise<unknown> {
    if (inflight) return inflight;
    inflight = fetchBridgeStatus(tradeBase)
        .catch((error) => {
            if (cache) return cache.data;
            throw error;
        })
        .finally(() => {
            inflight = null;
        });
    return inflight;
}

/**
 * Trade /bridge/status often takes 7–15s (Esplora + bitcoind + PDC).
 * Cache keeps Bridge page loads fast after the first fetch.
 */
export async function getCachedBridgeStatus(tradeBase: string): Promise<unknown> {
    const now = Date.now();
    if (cache && now - cache.at < TTL_MS) {
        return cache.data;
    }
    if (cache && now - cache.at < STALE_MS) {
        void refresh(tradeBase);
        return cache.data;
    }
    return refresh(tradeBase);
}

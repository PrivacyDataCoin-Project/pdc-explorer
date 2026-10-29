import BigNumber from "bignumber.js";

const COIN = new BigNumber("1000000000000");

/** Daemon `total_coins` may exceed 2^53. Read digits from the raw JSON body. */
export function readTotalCoinsAtomic(payload: string): string | null {
    const match = payload.match(/"total_coins"\s*:\s*"?(?<atomic>[0-9]+)"?/);
    return match?.groups?.atomic ?? null;
}

/** Whole PDC with two decimal places. Returns null when the input is not an integer atomic amount. */
export function formatTotalCoinsDisplay(raw: unknown): string | null {
    if (raw === undefined || raw === null || raw === "") return null;
    const atomic = new BigNumber(typeof raw === "string" || typeof raw === "number" ? String(raw) : "");
    if (!atomic.isFinite() || atomic.isNegative() || !atomic.isInteger()) return null;
    return atomic.div(COIN).toFixed(2);
}

/**
 * MEXC spot symbol. `PRICE_SYMBOL` is documented as a full market such as `PDCUSDT`,
 * while the Ethereum helper passes the base asset `ETH`.
 */
export function mexcSpotSymbol(symbol: string): string {
    const trimmed = symbol.trim().toUpperCase();
    if (!trimmed) return "";
    return trimmed.endsWith("USDT") ? trimmed : `${trimmed}USDT`;
}

/** 24h move as a percent. Ignores MEXC `priceChange`, which is an absolute quote delta. */
export function readPriceChangePercent(payload: { priceChangePercent?: unknown } | null | undefined): number | undefined {
    const raw = payload?.priceChangePercent;
    if (raw === undefined || raw === null || raw === "") return undefined;
    const parsed = typeof raw === "number" ? raw : parseFloat(String(raw));
    return Number.isFinite(parsed) ? parsed : undefined;
}

/** Unix seconds at the UTC start of the day containing `offsetSeconds`. */
export function utcDayStartSeconds(offsetSeconds: number): number {
    if (!Number.isFinite(offsetSeconds) || offsetSeconds <= 0) return 0;
    return offsetSeconds - (offsetSeconds % 86400);
}

export function isPowType(type: unknown): boolean {
    return String(type) === "1";
}

export function isPosType(type: unknown): boolean {
    return String(type) === "0";
}

export function clampInt(value: unknown, fallback: number, min: number, max: number): number {
    const parsed = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
    if (!Number.isFinite(parsed)) return fallback;
    const truncated = Math.trunc(parsed);
    if (truncated < min) return min;
    if (truncated > max) return max;
    return truncated;
}

/** Default 5, hard cap 100. Missing input keeps the historical default. */
export function blocksLimit(value: unknown): number {
    if (value === undefined || value === null || value === "") return 5;
    return clampInt(value, 5, 1, 100);
}

export function escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

const TX_ID = /^[0-9a-fA-F]{64}$/;

/** Key-image lookup must return the transaction hash, never the row primary key. */
export function txIdFromKeyimageLookup(data: unknown): string | null {
    if (typeof data !== "string" || !TX_ID.test(data)) return null;
    return data.toLowerCase();
}

export function transactionPathForKeyimage(data: unknown): string | null {
    const id = txIdFromKeyimageLookup(data);
    return id ? `/transaction/${id}` : null;
}

export function burnedPdcFromAtomic(atomic: string): number {
    const value = new BigNumber(atomic);
    if (!value.isFinite() || value.isNegative()) return 0;
    return value.div(COIN).toNumber();
}

export function assertPostgresIdent(name: string | undefined, label: string): string {
    if (!name || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
        throw new Error(`${label} must be a plain PostgreSQL identifier`);
    }
    return name;
}

export function unixSeconds(value: unknown): number {
    const parsed = parseInt(String(value ?? ""), 10);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
}

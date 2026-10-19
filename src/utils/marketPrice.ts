export type PdcMarketQuote = {
    usd: number;
    btcx: number;
};

export function formatUsdPrice(value: number): string {
    if (!Number.isFinite(value) || value < 0) return "";
    if (value === 0) return "$0.00";
    if (value >= 100) {
        const [int, dec] = value.toFixed(2).split(".");
        return `$${int.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}.${dec}`;
    }
    if (value >= 1) return `$${value.toFixed(2)}`;
    if (value >= 0.01) return `$${value.toFixed(4)}`;
    return `$${value.toPrecision(3)}`;
}

export function formatBtcxPrice(value: number): string {
    if (!Number.isFinite(value) || value < 0) return "";
    if (value === 0) return "0 BTCX";
    let fixed: string;
    if (value >= 1) fixed = value.toFixed(4);
    else if (value >= 0.0001) fixed = value.toFixed(6);
    else fixed = value.toFixed(8);
    return `${fixed.replace(/\.?0+$/, "")} BTCX`;
}

export function formatMarketHint(usd: number, btcx: number): string {
    const usdText = formatUsdPrice(usd);
    const btcxText = formatBtcxPrice(btcx);
    if (!usdText || !btcxText) return "";
    return `${usdText} · ${btcxText}`;
}

export function amountFromAtomic(value: string | number | undefined, decimals = 12): number | null {
    if (value == null || value === "") return null;
    try {
        const raw = BigInt(String(value).replace(/[^\d]/g, "") || "0");
        const base = BigInt(10) ** BigInt(decimals);
        const whole = raw / base;
        const frac = raw % base;
        return Number(whole) + Number(frac) / Number(base);
    } catch {
        const parsed = Number(value) / 10 ** decimals;
        return Number.isFinite(parsed) ? parsed : null;
    }
}

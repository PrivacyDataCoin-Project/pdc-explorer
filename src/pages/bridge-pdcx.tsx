import { useEffect, useState } from "react";
import styles from "@/styles/Bridge.module.scss";
import Fetch from "@/utils/methods";
import CopyButton from "@/components/UI/CopyButton/CopyButton";
import BridgeTabs from "@/components/default/BridgeTabs/BridgeTabs";
import { NETWORK, PDCX_ASSET_ID, PDC_ASSET_ID } from "@/config/network";
import { amountFromAtomic, holdingValueHint } from "@/utils/marketPrice";
import Link from "next/link";
import MatrixText from "@/components/UI/MatrixText/MatrixText";

interface PdcxBridgeStatus {
    pair?: string;
    ticker?: string;
    mode?: string;
    ready?: boolean;
    depositEnabled?: boolean;
    withdrawEnabled?: boolean;
    pdcAssetId?: string;
    pdcxAssetId?: string | null;
    pdcDecimals?: number;
    pdcxDecimals?: number;
    rate?: string;
    message?: string;
    oracleFeeAsset?: boolean;
    fundingPending?: boolean;
    emitBurnEnabled?: boolean;
    depositAddress?: string | null;
    minConfirmations?: number;
    poolAtomic?: string | number;
    unlockedPoolAtomic?: string | number;
    liabilityAtomic?: string | number;
    reservesOk?: boolean;
    custodyMode?: string;
    updatedAt?: number;
}

function toBigInt(value: string | number | undefined | null): bigint {
    if (value === undefined || value === null || value === "") return BigInt(0);
    try {
        return BigInt(typeof value === "number" ? Math.trunc(value) : value);
    } catch {
        return BigInt(0);
    }
}

function formatAtomic(atomic: bigint, decimals: number): string {
    if (atomic === BigInt(0)) return "0";
    const neg = atomic < BigInt(0);
    const v = neg ? -atomic : atomic;
    const base = BigInt(`1${"0".repeat(Math.max(0, decimals))}`);
    const whole = v / base;
    const frac = (v % base).toString().padStart(decimals, "0").replace(/0+$/, "");
    const body = frac ? `${whole}.${frac}` : whole.toString();
    return neg ? `-${body}` : body;
}

function formatAtomicGrouped(atomic: bigint): string {
    return atomic.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 1 human PDC (12 dec) ≡ 1 human PDCx (8 dec). */
function poolAsPdcxAtomic(poolPdcAtomic: bigint): bigint {
    return poolPdcAtomic / BigInt(10_000);
}

function coverageLabel(poolPdc: bigint, liabilityPdcx: bigint): string {
    const pool = poolAsPdcxAtomic(poolPdc);
    if (liabilityPdcx === BigInt(0)) {
        return pool > BigInt(0) ? "Fully covered" : "Unfunded";
    }
    const pct = Number((pool * BigInt(10000)) / liabilityPdcx) / 100;
    return `${pct.toFixed(2)}%`;
}

function coverageRatio(poolPdc: bigint, liabilityPdcx: bigint): number {
    const pool = poolAsPdcxAtomic(poolPdc);
    if (liabilityPdcx === BigInt(0)) return pool > BigInt(0) ? 100 : 0;
    const pct = Number((pool * BigInt(10000)) / liabilityPdcx) / 100;
    return Math.max(0, Math.min(100, pct));
}

interface PdcxHistoryItem {
    type: "mint" | "burn";
    status: string;
    amountAtomic: string;
    createdAt: number;
    txid?: string;
    depositTxid?: string;
    mintedTxId?: string;
    burnTxId?: string;
    paidTxId?: string;
    confirmations?: number;
    wrapTicker?: string;
    nativeTicker?: string;
    decimals?: number;
}

function statusPillClass(status: string | undefined): string {
    if (!status) return styles.pillMuted;
    if (status === "minted" || status === "paid") return styles.pillOk;
    if (status === "failed" || status === "rejected" || status === "cancelled") return styles.pillWarn;
    if (
        status === "confirming" ||
        status === "awaiting_pdc" ||
        status === "awaiting_burn" ||
        status === "burning" ||
        status === "minting" ||
        status === "paying"
    ) {
        return styles.pillInfo;
    }
    return styles.pillMuted;
}

function formatConfirmations(
    confirmations: number | undefined,
    minConfirmations: number,
    status: string
): string {
    if (confirmations == null || !Number.isFinite(confirmations)) {
        if (status === "awaiting_burn" || status === "burning" || status === "paying") return "—";
        return "—";
    }
    if (minConfirmations > 0) return `${confirmations} / ${minConfirmations}`;
    return String(confirmations);
}

function shortTxid(txid: string | undefined): string {
    if (!txid) return "—";
    if (txid.length <= 18) return txid;
    return `${txid.slice(0, 10)}…${txid.slice(-6)}`;
}

function formatHistoryTime(createdAt: number): string {
    if (!createdAt) return "—";
    try {
        return new Date(createdAt * 1000).toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
    } catch {
        return String(createdAt);
    }
}

function BridgePdcxPage() {
    const [status, setStatus] = useState<PdcxBridgeStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [pdcUsd, setPdcUsd] = useState<number | null>(null);
    const [btcxUsd, setBtcxUsd] = useState<number | null>(null);
    const [history, setHistory] = useState<PdcxHistoryItem[]>([]);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyMinConf, setHistoryMinConf] = useState(10);

    useEffect(() => {
        let stopped = false;

        async function loadMarket() {
            try {
                const result = await Fetch.getPdcMarket();
                if (stopped) return;
                const usd = Number(result?.data?.pdcUsd ?? result?.data?.pdcxUsd);
                const btcx = Number(result?.data?.btcxUsd);
                if (result?.success && Number.isFinite(usd) && usd > 0 && Number.isFinite(btcx) && btcx > 0) {
                    setPdcUsd(usd);
                    setBtcxUsd(btcx);
                    return;
                }
                setPdcUsd(null);
                setBtcxUsd(null);
            } catch {
                if (!stopped) {
                    setPdcUsd(null);
                    setBtcxUsd(null);
                }
            }
        }

        async function loadStatus() {
            try {
                const response = await Fetch.getBridgePdcxStatus();
                if (stopped) return;
                if (!response?.success || !response.data) {
                    setError(response?.error || "PDCx bridge status unavailable");
                    setStatus(null);
                    setLoading(false);
                    return;
                }
                setStatus(response.data);
                setError(null);
                setLoading(false);
            } catch (err: any) {
                if (stopped) return;
                setError(err?.message || "Failed to load PDCx bridge status");
                setStatus(null);
                setLoading(false);
            }
        }

        async function loadHistory() {
            try {
                const response = await Fetch.getBridgePdcxHistory(50, "all");
                if (stopped) return;
                if (!response?.success || !response.data) {
                    setHistoryError(response?.error || "PDCx bridge history unavailable");
                    setHistory([]);
                    setHistoryLoading(false);
                    return;
                }
                const items = Array.isArray(response.data.items) ? response.data.items : [];
                setHistory(items);
                const minConf = Number(response.data.minConfirmations);
                if (Number.isFinite(minConf) && minConf > 0) setHistoryMinConf(minConf);
                setHistoryError(null);
                setHistoryLoading(false);
            } catch (err: any) {
                if (stopped) return;
                setHistoryError(err?.message || "Failed to load PDCx bridge history");
                setHistory([]);
                setHistoryLoading(false);
            }
        }

        loadStatus();
        loadHistory();
        loadMarket();
        const timer = setInterval(() => {
            loadStatus();
            loadHistory();
            loadMarket();
        }, 30000);
        return () => {
            stopped = true;
            clearInterval(timer);
        };
    }, []);

    const pdcDecimals = status?.pdcDecimals ?? 12;
    const pdcxDecimals = status?.pdcxDecimals ?? 8;
    const pool = toBigInt(status?.poolAtomic);
    const liability = toBigInt(status?.liabilityAtomic);
    const reservesOk = status?.reservesOk ?? poolAsPdcxAtomic(pool) >= liability;
    const ready = status?.ready ?? false;
    const emitBurn = status?.emitBurnEnabled ?? false;
    const fundingPending = status?.fundingPending ?? true;
    const assetId = status?.pdcxAssetId || PDCX_ASSET_ID;
    const pdcAssetId = status?.pdcAssetId || PDC_ASSET_ID;
    const confirmations = status?.minConfirmations ?? 10;
    const coverage = coverageLabel(pool, liability);
    const barPct = coverageRatio(pool, liability);
    const custodyMode = status?.custodyMode || "mint_wallet";
    const custodyLabel = custodyMode === "tss" ? "TSS" : "Bridge wallet";
    const poolAmount = amountFromAtomic(pool.toString(), pdcDecimals);
    const liabilityAmount = amountFromAtomic(liability.toString(), pdcxDecimals);
    const poolHint = holdingValueHint(poolAmount, pdcUsd, btcxUsd);
    const liabilityHint = holdingValueHint(liabilityAmount, pdcUsd, btcxUsd);

    return (
        <section className={styles.page} aria-label="Bridge PDCx peg">
            <BridgeTabs />
            <div className={styles.head}>
                <div>
                    <div className={styles.titleRow}>
                        <img
                            className={styles.icon}
                            src="/currency-icons/pdcx.png"
                            alt=""
                            width={28}
                            height={28}
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/currency-icons/pdc.png";
                            }}
                        />
                        <h2>Bridge PDCx</h2>
                        <div className={styles.pills}>
                            <span className={`${styles.pill} ${reservesOk ? styles.pillOk : styles.pillWarn}`}>
                                {reservesOk ? "Reserves OK" : "Reserves check failed"}
                            </span>
                            <span className={`${styles.pill} ${ready ? styles.pillInfo : styles.pillMuted}`}>
                                {ready ? "Bridge ready" : "Bridge pending"}
                            </span>
                            <span className={`${styles.pill} ${emitBurn ? styles.pillOk : styles.pillWarn}`}>
                                {emitBurn ? "Emit/burn on" : "Emit/burn off"}
                            </span>
                            <span className={`${styles.pill} ${fundingPending ? styles.pillWarn : styles.pillOk}`}>
                                {fundingPending ? "Funding pending" : "Custody set"}
                            </span>
                        </div>
                    </div>
                </div>
                <p>
                    On-chain native PDC in the bridge wallet vs circulating PDCx liability (1:1 peg coverage).
                    Read-only public status from the Trade API.
                </p>
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                    {loading ? "" : " Refresh the page or try again shortly."}
                </div>
            )}

            <div className={styles.cards}>
                <article className={styles.card}>
                    <span>PDC in bridge wallet</span>
                    <MatrixText
                        as="strong"
                        className={styles.mono}
                        value={status ? `${formatAtomic(pool, pdcDecimals)} PDC` : "—"}
                        staggerMs={80}
                        duration={1000}
                    />
                    <em>{poolHint || "—"}</em>
                </article>
                <article className={styles.card}>
                    <span>PDCx minted liability</span>
                    <MatrixText
                        as="strong"
                        className={styles.mono}
                        value={status ? `${formatAtomic(liability, pdcxDecimals)} PDCX` : "—"}
                        staggerMs={150}
                        duration={1000}
                    />
                    <em>{liabilityHint || "—"}</em>
                </article>
                <article className={styles.card}>
                    <span>Coverage ratio</span>
                    <MatrixText
                        as="strong"
                        value={status ? coverage : "—"}
                        staggerMs={220}
                        duration={900}
                    />
                    <em>
                        {liability === BigInt(0)
                            ? "No circulating liability"
                            : `${formatAtomic(pool, pdcDecimals)} PDC / ${formatAtomic(liability, pdcxDecimals)} PDCX`}
                    </em>
                </article>
                <article className={styles.card}>
                    <span>Custody</span>
                    <strong>{custodyLabel}</strong>
                    <em>{custodyMode}</em>
                </article>
            </div>

            <div className={styles.coverage}>
                <div className={styles.coverageHead}>
                    <h3>Peg coverage</h3>
                    <p>
                        <MatrixText
                            value={
                                status
                                    ? `${formatAtomicGrouped(pool)} atomic PDC pool · ${formatAtomicGrouped(liability)} atomic PDCx liability`
                                    : "—"
                            }
                            staggerMs={280}
                            duration={1100}
                        />
                    </p>
                </div>
                <div className={styles.barTrack} aria-hidden>
                    <div className={styles.barFill} style={{ width: `${barPct}%` }} />
                </div>
                <p className={styles.note}>
                    Pool via mint custody wallet-rpc balance; liability from on-chain PDCx{" "}
                    <code>current_supply</code> (1 human PDC ≡ 1 human PDCx)
                    {status?.updatedAt
                        ? ` · Updated ${new Date(status.updatedAt * 1000).toISOString()}.`
                        : "."}
                </p>
            </div>

            <div className={styles.grid}>
                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h3>Deposit &amp; policy</h3>
                        <p>Same-L1 wrap — native PDC ↔ PDCx (oracle fee CA).</p>
                    </div>
                    <table className={styles.table}>
                        <tbody>
                            <tr>
                                <th>PDC bridge address</th>
                                <td>
                                    {status?.depositAddress ? (
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                gap: 8,
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <CopyButton text={status.depositAddress} />
                                            <span
                                                className={styles.mono}
                                                style={{ fontSize: 12, wordBreak: "break-all" }}
                                            >
                                                {status.depositAddress}
                                            </span>
                                        </span>
                                    ) : (
                                        <span className={styles.pill + " " + styles.pillMuted}>Not published</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <th>Confirmations</th>
                                <td>{confirmations}</td>
                            </tr>
                            <tr>
                                <th>Peg rate</th>
                                <td>{status?.rate || "1:1"} · PDC ↔ PDCX</td>
                            </tr>
                            <tr>
                                <th>PDCx asset id</th>
                                <td>
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            gap: 8,
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <CopyButton text={assetId} />
                                        <span
                                            className={styles.mono}
                                            style={{ fontSize: 12, wordBreak: "break-all" }}
                                        >
                                            {assetId}
                                        </span>
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <th>Native PDC asset id</th>
                                <td>
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            gap: 8,
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <CopyButton text={pdcAssetId} />
                                        <span
                                            className={styles.mono}
                                            style={{ fontSize: 12, wordBreak: "break-all" }}
                                        >
                                            {pdcAssetId}
                                        </span>
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <th>Trade portal</th>
                                <td>
                                    <Link href={`${NETWORK.tradeWebsite}bridge`} target="_blank" rel="noreferrer">
                                        trade.privacydatacoin.com/bridge
                                    </Link>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <p className={styles.callout}>
                        Peg is 1:1 PDC ↔ PDCx. Emit only after confirmed PDC deposit; burn unlocks native PDC
                        from custody. Circulating PDCx must stay covered by locked PDC.
                    </p>
                </div>

                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h3>Health</h3>
                        <p>Trade <code>GET /api/bridge/pdcx/status</code>.</p>
                    </div>
                    <table className={styles.table}>
                        <tbody>
                            <tr>
                                <th>Ready</th>
                                <td>
                                    <span className={`${styles.pill} ${ready ? styles.pillOk : styles.pillWarn}`}>
                                        {ready ? "Yes" : "No"}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <th>Reserves</th>
                                <td>
                                    <span
                                        className={`${styles.pill} ${reservesOk ? styles.pillOk : styles.pillWarn}`}
                                    >
                                        {reservesOk ? "OK" : "Shortfall"}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <th>Mode</th>
                                <td>{status?.mode || (loading ? "Loading…" : "—")}</td>
                            </tr>
                            <tr>
                                <th>Deposit / withdraw</th>
                                <td>
                                    {(status?.depositEnabled ? "Deposit on" : "Deposit off")}
                                    {" · "}
                                    {(status?.withdrawEnabled ? "Withdraw on" : "Withdraw off")}
                                </td>
                            </tr>
                            <tr>
                                <th>Oracle fee asset</th>
                                <td>{status?.oracleFeeAsset ? "Yes" : "No"}</td>
                            </tr>
                            <tr>
                                <th>Bridge message</th>
                                <td style={{ fontFamily: "var(--sans)", wordBreak: "break-word" }}>
                                    {status?.message || (loading ? "Loading…" : "—")}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={styles.panel}>
                <div className={styles.panelHead}>
                    <h3>Bridge history</h3>
                    <p>
                        Recent PDCx mint and burn events from the Trade wrap ledger.
                        Amounts and txids only — no PDC or destination addresses.
                    </p>
                </div>
                {historyError && <p className={styles.lookupMsg}>{historyError}</p>}
                {!historyError && (
                    <div className={styles.historyWrap}>
                        <table className={styles.historyTable}>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Conf</th>
                                    <th>Time</th>
                                    <th>Txid</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyLoading && history.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>Loading…</td>
                                    </tr>
                                ) : history.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>No mint or burn events yet.</td>
                                    </tr>
                                ) : (
                                    history.map((item, idx) => {
                                        const itemDecimals = item.decimals ?? pdcxDecimals;
                                        const atomic = toBigInt(item.amountAtomic);
                                        const amount = amountFromAtomic(atomic.toString(), itemDecimals);
                                        const priceHint = holdingValueHint(amount, pdcUsd, btcxUsd);
                                        const primary =
                                            item.type === "mint"
                                                ? item.mintedTxId || item.depositTxid || item.txid
                                                : item.burnTxId || item.paidTxId || item.txid;
                                        const href =
                                            item.type === "mint" && item.mintedTxId
                                                ? `/transaction/${item.mintedTxId}`
                                                : item.type === "burn" && item.burnTxId
                                                  ? `/transaction/${item.burnTxId}`
                                                  : null;
                                        const confLabel = formatConfirmations(
                                            item.confirmations,
                                            historyMinConf,
                                            item.status
                                        );
                                        const txidLabel =
                                            !primary && item.type === "burn"
                                                ? item.status === "awaiting_burn"
                                                    ? "awaiting burn"
                                                    : item.status === "failed"
                                                      ? "no tx (failed)"
                                                      : "awaiting payout"
                                                : shortTxid(primary);
                                        return (
                                            <tr key={`${item.type}-${item.createdAt}-${primary || idx}`}>
                                                <td>
                                                    <span
                                                        className={`${styles.pill} ${
                                                            item.type === "mint" ? styles.pillOk : styles.pillInfo
                                                        }`}
                                                    >
                                                        {item.type === "mint" ? "Mint" : "Burn"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {formatAtomic(atomic, itemDecimals)}{" "}
                                                    {item.wrapTicker || "PDCX"}
                                                    <em className={styles.historySub}>
                                                        {priceHint || "—"}
                                                    </em>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`${styles.pill} ${statusPillClass(item.status)}`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td>{confLabel}</td>
                                                <td>{formatHistoryTime(item.createdAt)}</td>
                                                <td>
                                                    {href && primary ? (
                                                        <a href={href}>{shortTxid(primary)}</a>
                                                    ) : (
                                                        txidLabel
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <p className={styles.note}>
                PDCx reserves sit in the same-L1 mint custody wallet. Destination addresses from private
                invoices are never listed on this page.
            </p>
        </section>
    );
}

export default BridgePdcxPage;

import { useEffect, useState } from "react";
import styles from "@/styles/Bridge.module.scss";
import Fetch from "@/utils/methods";
import CopyButton from "@/components/UI/CopyButton/CopyButton";
import BridgeTabs from "@/components/default/BridgeTabs/BridgeTabs";
import { ARQX_ASSET_ID, ARQX_DEPOSIT_ADDRESS, NETWORK } from "@/config/network";
import Link from "next/link";

interface ArqxBridgeStatus {
    slug?: string;
    ready?: boolean;
    wrapTicker?: string;
    nativeTicker?: string;
    decimals?: number;
    assetId?: string;
    pair?: string;
    depositEnabled?: boolean;
    withdrawEnabled?: boolean;
    mode?: string;
    chainAdapter?: string;
    message?: string;
    mintOwnerHint?: string;
    watcherReady?: boolean;
    watcherTodo?: string;
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

function coverageLabel(pool: bigint, liability: bigint): string {
    if (liability === BigInt(0)) {
        return pool > BigInt(0) ? "Fully covered" : "Unfunded";
    }
    const pct = Number((pool * BigInt(10000)) / liability) / 100;
    return `${pct.toFixed(2)}%`;
}

function coverageRatio(pool: bigint, liability: bigint): number {
    if (liability === BigInt(0)) return pool > BigInt(0) ? 100 : 0;
    const pct = Number((pool * BigInt(10000)) / liability) / 100;
    return Math.max(0, Math.min(100, pct));
}

interface ArqxHistoryItem {
    type: "mint" | "burn";
    status: string;
    amountAtomic: string;
    createdAt: number;
    txid?: string;
    depositTxid?: string;
    mintedTxId?: string;
    paidTxId?: string;
    wrapTicker?: string;
    nativeTicker?: string;
    decimals?: number;
}

function statusPillClass(status: string | undefined): string {
    if (!status) return styles.pillMuted;
    if (status === "minted" || status === "paid") return styles.pillOk;
    if (status === "rejected" || status === "cancelled" || status === "expired") return styles.pillWarn;
    if (
        status === "confirming" ||
        status === "awaiting_tss" ||
        status === "awaiting_federation" ||
        status === "burning" ||
        status === "minting"
    ) {
        return styles.pillInfo;
    }
    return styles.pillMuted;
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

function BridgeArqxPage() {
    const [status, setStatus] = useState<ArqxBridgeStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<ArqxHistoryItem[]>([]);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        let stopped = false;

        async function loadStatus() {
            try {
                const response = await Fetch.getBridgeArqxStatus();
                if (stopped) return;
                if (!response?.success || !response.data) {
                    setError(response?.error || "ARQX bridge status unavailable");
                    setStatus(null);
                    setLoading(false);
                    return;
                }
                setStatus(response.data);
                setError(null);
                setLoading(false);
            } catch (err: any) {
                if (stopped) return;
                setError(err?.message || "Failed to load ARQX bridge status");
                setStatus(null);
                setLoading(false);
            }
        }

        async function loadHistory() {
            try {
                const response = await Fetch.getBridgeArqxHistory(50, "all");
                if (stopped) return;
                if (!response?.success || !response.data) {
                    setHistoryError(response?.error || "ARQX bridge history unavailable");
                    setHistory([]);
                    setHistoryLoading(false);
                    return;
                }
                const items = Array.isArray(response.data.items) ? response.data.items : [];
                setHistory(items);
                setHistoryError(null);
                setHistoryLoading(false);
            } catch (err: any) {
                if (stopped) return;
                setHistoryError(err?.message || "Failed to load ARQX bridge history");
                setHistory([]);
                setHistoryLoading(false);
            }
        }

        loadStatus();
        loadHistory();
        const timer = setInterval(() => {
            loadStatus();
            loadHistory();
        }, 30000);
        return () => {
            stopped = true;
            clearInterval(timer);
        };
    }, []);

    const decimals = status?.decimals ?? 9;
    const pool = toBigInt(status?.poolAtomic);
    const liability = toBigInt(status?.liabilityAtomic);
    const reservesOk = status?.reservesOk ?? (pool >= liability);
    const ready = status?.ready ?? false;
    const watcherReady = status?.watcherReady ?? false;
    const assetId = status?.assetId || ARQX_ASSET_ID;
    const confirmations = status?.minConfirmations ?? 10;
    const coverage = coverageLabel(pool, liability);
    const barPct = coverageRatio(pool, liability);
    const custodyMode = status?.custodyMode || "cn_wallet";
    const custodyLabel = custodyMode === "tss" ? "TSS" : "Bridge wallet";

    return (
        <section className={styles.page} aria-label="Bridge ARQX peg">
            <BridgeTabs />
            <div className={styles.head}>
                <div>
                    <div className={styles.titleRow}>
                        <img
                            className={styles.icon}
                            src="/currency-icons/arq.png"
                            alt=""
                            width={28}
                            height={28}
                        />
                        <h2>Bridge ARQX</h2>
                        <div className={styles.pills}>
                            <span className={`${styles.pill} ${reservesOk ? styles.pillOk : styles.pillWarn}`}>
                                {reservesOk ? "Reserves OK" : "Reserves check failed"}
                            </span>
                            <span className={`${styles.pill} ${ready ? styles.pillInfo : styles.pillMuted}`}>
                                {ready ? "Bridge ready" : "Bridge pending"}
                            </span>
                            <span className={`${styles.pill} ${watcherReady ? styles.pillInfo : styles.pillMuted}`}>
                                {watcherReady ? "Watcher live" : "Watcher pending"}
                            </span>
                        </div>
                    </div>
                </div>
                <p>
                    On-chain ARQ in the bridge wallet vs circulating ARQX liability (1:1 peg coverage).
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
                    <span>ARQ in bridge wallet</span>
                    <strong className={styles.mono}>{formatAtomic(pool, decimals)} ARQ</strong>
                    <em>{formatAtomicGrouped(pool)} atomic</em>
                </article>
                <article className={styles.card}>
                    <span>ARQX minted liability</span>
                    <strong className={styles.mono}>{formatAtomic(liability, decimals)} ARQX</strong>
                    <em>{formatAtomicGrouped(liability)} atomic</em>
                </article>
                <article className={styles.card}>
                    <span>Coverage ratio</span>
                    <strong>{status ? coverage : "—"}</strong>
                    <em>
                        {liability === BigInt(0)
                            ? "No circulating liability"
                            : `${formatAtomic(pool, decimals)} / ${formatAtomic(liability, decimals)} ARQ`}
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
                        {formatAtomicGrouped(pool)} atomic pool · {formatAtomicGrouped(liability)} atomic liability
                    </p>
                </div>
                <div className={styles.barTrack} aria-hidden>
                    <div className={styles.barFill} style={{ width: `${barPct}%` }} />
                </div>
                <p className={styles.note}>
                    Pool via Arqma deposit wallet-rpc balance; liability from on-chain ARQX{" "}
                    <code>current_supply</code>
                    {status?.updatedAt
                        ? ` · Updated ${new Date(status.updatedAt * 1000).toISOString()}.`
                        : "."}
                </p>
            </div>

            <div className={styles.grid}>
                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h3>Deposit &amp; policy</h3>
                        <p>ARQ → ARQX wrap path (live wallet-rpc watcher).</p>
                    </div>
                    <table className={styles.table}>
                        <tbody>
                            <tr>
                                <th>ARQ bridge address</th>
                                <td>
                                    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                        <CopyButton text={ARQX_DEPOSIT_ADDRESS} />
                                        <span className={styles.mono} style={{ fontSize: 12, wordBreak: "break-all" }}>
                                            {ARQX_DEPOSIT_ADDRESS}
                                        </span>
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <th>Native chain</th>
                                <td>
                                    Arqma ({status?.nativeTicker || "ARQ"}) ·{" "}
                                    <Link href={NETWORK.arqmaWebsite} target="_blank" rel="noreferrer">
                                        arqma.com
                                    </Link>
                                </td>
                            </tr>
                            <tr>
                                <th>Confirmations</th>
                                <td>{confirmations}</td>
                            </tr>
                            <tr>
                                <th>Chain adapter</th>
                                <td>{status?.chainAdapter || "cryptonote"}</td>
                            </tr>
                            <tr>
                                <th>ARQX asset id</th>
                                <td>
                                    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                        <CopyButton text={assetId} />
                                        <span className={styles.mono} style={{ fontSize: 12, wordBreak: "break-all" }}>
                                            {assetId}
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
                        Peg is 1:1 ARQ ↔ ARQX. Mint uses the same remote mint-signer / CA owner path as BTCX.
                        Personal deposit invoices are created in the Trade portal (not listed publicly here).
                    </p>
                </div>

                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h3>Health</h3>
                        <p>Watcher readiness and bridge message from Trade.</p>
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
                                <th>Watcher</th>
                                <td>
                                    <span className={`${styles.pill} ${watcherReady ? styles.pillInfo : styles.pillMuted}`}>
                                        {watcherReady ? "Ready" : "Not ready"}
                                    </span>
                                    {status?.watcherTodo ? (
                                        <em className={styles.historySub}> {status.watcherTodo}</em>
                                    ) : null}
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
                                <th>Bridge message</th>
                                <td style={{ fontFamily: "var(--sans)", wordBreak: "break-word" }}>
                                    {status?.message || (loading ? "Loading…" : "—")}
                                </td>
                            </tr>
                            <tr>
                                <th>Mint owner</th>
                                <td style={{ fontFamily: "var(--sans)", wordBreak: "break-word" }}>
                                    {status?.mintOwnerHint || "—"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <p className={styles.callout}>
                        Source: Trade <code>GET /api/bridge/arqx/status</code> via explorer proxy
                        (wallet balance + on-chain supply).
                    </p>
                </div>
            </div>

            <div className={styles.panel}>
                <div className={styles.panelHead}>
                    <h3>Bridge history</h3>
                    <p>
                        Recent ARQX mint and burn events from the Trade wrap ledger.
                        Amounts and txids only — no PDC or destination addresses.
                    </p>
                </div>
                {historyError && (
                    <p className={styles.lookupMsg}>{historyError}</p>
                )}
                {!historyError && (
                    <div className={styles.historyWrap}>
                        <table className={styles.historyTable}>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                    <th>Txid</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyLoading && history.length === 0 ? (
                                    <tr>
                                        <td colSpan={5}>Loading…</td>
                                    </tr>
                                ) : history.length === 0 ? (
                                    <tr>
                                        <td colSpan={5}>No mint or burn events yet.</td>
                                    </tr>
                                ) : (
                                    history.map((item, idx) => {
                                        const itemDecimals = item.decimals ?? decimals;
                                        const atomic = toBigInt(item.amountAtomic);
                                        const primary =
                                            item.type === "mint"
                                                ? item.mintedTxId || item.depositTxid || item.txid
                                                : item.paidTxId || item.txid;
                                        const href =
                                            item.type === "mint" && item.mintedTxId
                                                ? `/transaction/${item.mintedTxId}`
                                                : null;
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
                                                    {item.wrapTicker || "ARQX"}
                                                    <em className={styles.historySub}>
                                                        {formatAtomicGrouped(atomic)} atomic
                                                    </em>
                                                </td>
                                                <td>
                                                    <span className={`${styles.pill} ${statusPillClass(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td>{formatHistoryTime(item.createdAt)}</td>
                                                <td>
                                                    {href && primary ? (
                                                        <a href={href}>{shortTxid(primary)}</a>
                                                    ) : (
                                                        shortTxid(primary)
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
                Unlike BTCX (Bitcoin TSS pool), ARQ reserves sit in the Arqma bridge deposit wallet.
                Destination PDC addresses from private invoices are never listed on this page.
            </p>
        </section>
    );
}

export default BridgeArqxPage;

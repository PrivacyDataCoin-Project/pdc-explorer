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
    updatedAt?: number;
}

function formatAtomic(atomic: string | number | undefined | null, decimals: number): string {
    if (atomic === undefined || atomic === null || atomic === "") return "0";
    try {
        const raw = typeof atomic === "number" ? BigInt(Math.trunc(atomic)) : BigInt(atomic);
        if (raw === BigInt(0)) return "0";
        const neg = raw < BigInt(0);
        const v = neg ? -raw : raw;
        // Avoid BigInt ** (ES2016+) — build target is ES5.
        const base = BigInt(`1${"0".repeat(Math.max(0, decimals))}`);
        const whole = v / base;
        const frac = (v % base).toString().padStart(decimals, "0").replace(/0+$/, "");
        const body = frac ? `${whole}.${frac}` : whole.toString();
        return neg ? `-${body}` : body;
    } catch {
        return String(atomic);
    }
}

function BridgeArqxPage() {
    const [status, setStatus] = useState<ArqxBridgeStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [supplyAtomic, setSupplyAtomic] = useState<string | null>(null);

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

        async function loadSupply() {
            try {
                const response = await Fetch.getAssetDetails(ARQX_ASSET_ID);
                if (stopped) return;
                const asset = response?.success ? response.asset : null;
                const supply = asset?.current_supply;
                if (supply != null) setSupplyAtomic(String(supply));
            } catch {
                // optional enrichment
            }
        }

        loadStatus();
        loadSupply();
        const timer = setInterval(() => {
            loadStatus();
            loadSupply();
        }, 30000);
        return () => {
            stopped = true;
            clearInterval(timer);
        };
    }, []);

    const ready = status?.ready ?? false;
    const watcherReady = status?.watcherReady ?? false;
    const depositEnabled = status?.depositEnabled ?? false;
    const withdrawEnabled = status?.withdrawEnabled ?? false;
    const decimals = status?.decimals ?? 9;
    const assetId = status?.assetId || ARQX_ASSET_ID;
    const circulating = formatAtomic(supplyAtomic, decimals);
    const confirmations = 10;

    return (
        <section className={styles.page} aria-label="Bridge ARQX peg">
            <BridgeTabs />
            <div className={styles.head}>
                <div>
                    <div className={styles.titleRow}>
                        <img
                            className={styles.icon}
                            src="/currency-icons/arqx.svg"
                            alt=""
                            width={28}
                            height={28}
                        />
                        <h2>Bridge ARQX</h2>
                        <div className={styles.pills}>
                            <span className={`${styles.pill} ${ready ? styles.pillOk : styles.pillWarn}`}>
                                {ready ? "Bridge ready" : "Bridge pending"}
                            </span>
                            <span className={`${styles.pill} ${watcherReady ? styles.pillInfo : styles.pillMuted}`}>
                                {watcherReady ? "Watcher live" : "Watcher pending"}
                            </span>
                            <span className={`${styles.pill} ${styles.pillMuted}`}>
                                {(status?.mode || "—").toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
                <p>
                    ARQ → ARQX wrap on PDC (1:1 via Trade). Cryptonote deposit watcher + remote mint —
                    read-only status from the Trade API.
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
                    <span>Circulating ARQX</span>
                    <strong className={styles.mono}>{circulating} ARQX</strong>
                    <em>{decimals} decimals · on-chain supply</em>
                </article>
                <article className={styles.card}>
                    <span>Deposit</span>
                    <strong>{depositEnabled ? "Enabled" : "Disabled"}</strong>
                    <em>ARQ → mint ARQX</em>
                </article>
                <article className={styles.card}>
                    <span>Withdraw</span>
                    <strong>{withdrawEnabled ? "Enabled" : "Disabled"}</strong>
                    <em>Burn ARQX → ARQ payout</em>
                </article>
                <article className={styles.card}>
                    <span>Market pair</span>
                    <strong>{status?.pair || "ARQX/BTCX"}</strong>
                    <em>Trade hub listing</em>
                </article>
            </div>

            <div className={styles.grid}>
                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h3>Deposit &amp; policy</h3>
                        <p>ARQ deposit path for the ARQX wrap (live wallet-rpc watcher).</p>
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
                            <tr>
                                <th>Updated</th>
                                <td>
                                    {status?.updatedAt
                                        ? new Date(status.updatedAt * 1000).toISOString()
                                        : "—"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <p className={styles.callout}>
                        Source: Trade <code>GET /api/bridge/arqx/status</code> via explorer proxy.
                        Circulating supply from on-chain <code>get_asset_info</code>.
                    </p>
                </div>
            </div>

            <p className={styles.note}>
                Unlike BTCX, ARQX deposits are watched on Arqma (cryptonote wallet-rpc). Destination PDC
                addresses from private invoices are never listed on this page.
            </p>
        </section>
    );
}

export default BridgeArqxPage;

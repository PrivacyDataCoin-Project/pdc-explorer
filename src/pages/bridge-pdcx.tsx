import { useEffect, useState } from "react";
import styles from "@/styles/Bridge.module.scss";
import Fetch from "@/utils/methods";
import CopyButton from "@/components/UI/CopyButton/CopyButton";
import BridgeTabs from "@/components/default/BridgeTabs/BridgeTabs";
import { NETWORK, PDCX_ASSET_ID, PDC_ASSET_ID } from "@/config/network";
import { amountFromAtomic } from "@/utils/marketPrice";
import Link from "next/link";

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

function BridgePdcxPage() {
    const [status, setStatus] = useState<PdcxBridgeStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [supplyAtomic, setSupplyAtomic] = useState<string | null>(null);
    const [supplyError, setSupplyError] = useState<string | null>(null);

    useEffect(() => {
        let stopped = false;

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

        async function loadSupply() {
            try {
                const response = await Fetch.getAssetDetails(PDCX_ASSET_ID);
                if (stopped) return;
                const asset = response?.data?.asset || response?.data || response?.asset;
                const supply = asset?.current_supply ?? asset?.asset_descriptor?.current_supply;
                if (supply != null) {
                    setSupplyAtomic(String(supply));
                    setSupplyError(null);
                } else {
                    setSupplyError("On-chain supply unavailable");
                }
            } catch (err: any) {
                if (!stopped) setSupplyError(err?.message || "Failed to load PDCx supply");
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

    const decimals = status?.pdcxDecimals ?? 8;
    const assetId = status?.pdcxAssetId || PDCX_ASSET_ID;
    const pdcAssetId = status?.pdcAssetId || PDC_ASSET_ID;
    const mode = status?.mode || "off";
    const ready = status?.ready ?? false;
    const fundingPending = status?.fundingPending ?? true;
    const emitBurn = status?.emitBurnEnabled ?? false;
    const supply = supplyAtomic != null ? BigInt(supplyAtomic) : null;
    const supplyHuman = supply != null ? formatAtomic(supply, decimals) : "—";
    const supplyAmount = supply != null ? amountFromAtomic(supply.toString(), decimals) : null;

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
                            <span className={`${styles.pill} ${ready ? styles.pillInfo : styles.pillMuted}`}>
                                {ready ? "Status live" : "Bridge pending"}
                            </span>
                            <span className={`${styles.pill} ${!emitBurn ? styles.pillWarn : styles.pillOk}`}>
                                {emitBurn ? "Emit/burn on" : "Emit/burn off"}
                            </span>
                            <span className={`${styles.pill} ${fundingPending ? styles.pillWarn : styles.pillOk}`}>
                                {fundingPending ? "Funding pending" : "Custody set"}
                            </span>
                        </div>
                    </div>
                </div>
                <p>
                    Wrapped PDC (display <strong>PDCX</strong>; on-chain ticker <code>PDCx</code>) — 1:1 wrap of
                    native PDC for oracle attestation fees. Status + custody deposit from Trade.
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
                    <span>On-chain PDCx supply</span>
                    <strong className={styles.mono}>{supplyHuman} PDCX</strong>
                    <em>
                        {supplyError
                            ? supplyError
                            : supplyAmount != null
                              ? `${supplyAmount} human · ${decimals} decimals`
                              : "—"}
                    </em>
                </article>
                <article className={styles.card}>
                    <span>Peg rate</span>
                    <strong>{status?.rate || "1:1"}</strong>
                    <em>PDC ↔ PDCX (atomic scale 1e4)</em>
                </article>
                <article className={styles.card}>
                    <span>Mode</span>
                    <strong>{mode}</strong>
                    <em>{status?.pair || "PDC-PDCX"}</em>
                </article>
                <article className={styles.card}>
                    <span>Oracle fee asset</span>
                    <strong>{status?.oracleFeeAsset ? "Yes" : "No"}</strong>
                    <em>Attestation fee CA</em>
                </article>
            </div>

            <div className={styles.grid}>
                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h3>Asset &amp; policy</h3>
                        <p>Same-L1 wrap — no external chain. Emit/burn stays operator-gated.</p>
                    </div>
                    <table className={styles.table}>
                        <tbody>
                            <tr>
                                <th>PDCx asset id</th>
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
                                <th>Native PDC asset id</th>
                                <td>
                                    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                        <CopyButton text={pdcAssetId} />
                                        <span className={styles.mono} style={{ fontSize: 12, wordBreak: "break-all" }}>
                                            {pdcAssetId}
                                        </span>
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <th>Deposit / withdraw</th>
                                <td>
                                    {(status?.depositEnabled ? "Deposit on" : "Deposit off")}
                                    {" · "}
                                    {(status?.withdrawEnabled ? "Withdraw on" : "Withdraw off")}
                                    {status?.minConfirmations != null
                                        ? ` · ≥${status.minConfirmations} conf`
                                        : ""}
                                </td>
                            </tr>
                            <tr>
                                <th>Custody deposit (PDC)</th>
                                <td>
                                    {status?.depositAddress ? (
                                        <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                            <CopyButton text={status.depositAddress} />
                                            <span className={styles.mono} style={{ fontSize: 12, wordBreak: "break-all" }}>
                                                {status.depositAddress}
                                            </span>
                                        </span>
                                    ) : (
                                        <span className={styles.pill + " " + styles.pillMuted}>Not published</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <th>Trade portal</th>
                                <td>
                                    <Link href={NETWORK.tradeWebsite} target="_blank" rel="noreferrer">
                                        trade.privacydatacoin.com
                                    </Link>
                                    {" · "}
                                    <span style={{ fontFamily: "var(--sans)", fontSize: 13 }}>
                                        API <code>/api/bridge/pdcx/*</code>
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <p className={styles.callout}>
                        Peg target: circulating PDCx backed 1:1 by locked native PDC after live wrap is funded.
                        Excess pre-mint supply is burned down for tests; Trade wrap UX comes later.
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
                                <th>Funding</th>
                                <td>
                                    <span className={`${styles.pill} ${fundingPending ? styles.pillWarn : styles.pillOk}`}>
                                        {fundingPending ? "Pending" : "Ready"}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <th>Emit / burn</th>
                                <td>
                                    <span className={`${styles.pill} ${emitBurn ? styles.pillOk : styles.pillMuted}`}>
                                        {emitBurn ? "Enabled" : "Disabled"}
                                    </span>
                                </td>
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
        </section>
    );
}

export default BridgePdcxPage;

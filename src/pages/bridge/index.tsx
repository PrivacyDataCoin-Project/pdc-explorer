import { FormEvent, useEffect, useState } from "react";
import styles from "@/styles/Bridge.module.scss";
import Fetch from "@/utils/methods";
import CopyButton from "@/components/UI/CopyButton/CopyButton";

/** Public TSS deposit address for the BTCX peg (not always present in status JSON). */
export const BTCX_TSS_ADDRESS = "bc1q7qlagem4lsp02x8uq2mx0zrrdjvn8m8k8lcn3d";

interface BitcoinSync {
    blocks?: number;
    headers?: number;
    initialBlockDownload?: boolean;
    verificationProgress?: number;
}

interface BridgeStatus {
    ready?: boolean;
    reservesOk?: boolean;
    tssPoolSats?: string | number;
    liabilitySats?: string | number;
    assetId?: string;
    ticker?: string;
    minConfirmations?: number;
    message?: string;
    updatedAt?: number;
    security?: {
        reservesOk?: boolean;
        depositMinSats?: string | number;
        depositMinUsd?: number;
        withdrawMinSats?: string | number;
        minConfirmations?: number;
    };
    tss?: {
        custodyMode?: string;
        threshold?: number;
        parties?: number;
        withdrawFeeSats?: number;
        feePolicy?: {
            depositNetworkFee?: string;
            withdrawNetworkFee?: string;
            pegNeutral?: boolean;
        };
    };
    bitcoinSync?: BitcoinSync;
}

function toBigInt(value: string | number | undefined | null): bigint {
    if (value === undefined || value === null || value === "") return BigInt(0);
    try {
        return BigInt(typeof value === "number" ? Math.trunc(value) : value);
    } catch {
        return BigInt(0);
    }
}

function satsToBtc(sats: bigint): string {
    const satoshi = BigInt(100000000);
    const whole = sats / satoshi;
    const frac = (sats % satoshi).toString().padStart(8, "0");
    return `${whole}.${frac}`;
}

function formatSats(sats: bigint): string {
    return sats.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

interface DepositLookup {
    found?: boolean;
    status?: string;
    amountSats?: string;
    confirmations?: number;
    btcTxid?: string;
    btcVout?: number;
    mintedTxId?: string;
    hint?: string;
    updatedAt?: number;
}

const BTC_TXID_RE = /^[0-9a-fA-F]{64}$/;

function statusPillClass(status: string | undefined): string {
    if (!status) return styles.pillMuted;
    if (status === "minted") return styles.pillOk;
    if (status === "rejected" || status === "cancelled" || status === "expired") return styles.pillWarn;
    if (status === "confirming" || status === "awaiting_tss" || status === "awaiting_federation") {
        return styles.pillInfo;
    }
    return styles.pillMuted;
}

function BridgePage() {
    const [status, setStatus] = useState<BridgeStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [txidInput, setTxidInput] = useState("");
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [lookup, setLookup] = useState<DepositLookup | null>(null);

    useEffect(() => {
        let stopped = false;

        async function load() {
            try {
                const response = await Fetch.getBridgeStatus();
                if (stopped) return;
                if (!response?.success || !response.data) {
                    setError(response?.error || "Bridge status unavailable");
                    setStatus(null);
                    setLoading(false);
                    return;
                }
                setStatus(response.data);
                setError(null);
                setLoading(false);
            } catch (err: any) {
                if (stopped) return;
                setError(err?.message || "Failed to load bridge status");
                setStatus(null);
                setLoading(false);
            }
        }

        load();
        const timer = setInterval(load, 30000);
        return () => {
            stopped = true;
            clearInterval(timer);
        };
    }, []);

    async function lookupDeposit(e?: FormEvent) {
        if (e) e.preventDefault();
        const txid = txidInput.trim();
        setLookupError(null);
        setLookup(null);
        if (!BTC_TXID_RE.test(txid)) {
            setLookupError("Enter a valid Bitcoin transaction ID (64 hex characters).");
            return;
        }
        setLookupLoading(true);
        try {
            const response = await Fetch.getBridgeDepositByTxid(txid);
            if (response?.found === false || response?.data?.found === false) {
                setLookup({ found: false });
                setLookupError(
                    "No bridge deposit found for this transaction. It may only be on mempool.space, " +
                    "the txid may be wrong, or the payment is not bound to a deposit invoice yet."
                );
                return;
            }
            if (!response?.success || !response.data) {
                setLookupError(response?.error || "Lookup failed");
                return;
            }
            setLookup(response.data);
        } catch (err: any) {
            setLookupError(err?.message || "Lookup failed");
        } finally {
            setLookupLoading(false);
        }
    }

    const pool = toBigInt(status?.tssPoolSats);
    const liability = toBigInt(status?.liabilitySats);
    const depositMin = toBigInt(status?.security?.depositMinSats);
    const withdrawMin = toBigInt(status?.security?.withdrawMinSats);
    const withdrawFee = BigInt(status?.tss?.withdrawFeeSats ?? 0); // number coerced via BigInt()
    const depositMinUsd = status?.security?.depositMinUsd;
    const reservesOk = status?.reservesOk ?? status?.security?.reservesOk ?? false;
    const ready = status?.ready ?? false;
    const threshold = status?.tss?.threshold ?? 2;
    const parties = status?.tss?.parties ?? 3;
    const confirmations = status?.minConfirmations ?? status?.security?.minConfirmations ?? 6;
    const assetId = status?.assetId || "";
    const sync = status?.bitcoinSync;
    const ibd = sync?.initialBlockDownload === true;
    const ibdPct = sync?.verificationProgress != null
        ? Math.round(sync.verificationProgress * 1000) / 10
        : null;
    const coverage = coverageLabel(pool, liability);
    const barPct = coverageRatio(pool, liability);

    return (
        <section className={styles.page} aria-label="Bridge BTCX peg">
            <div className={styles.head}>
                <div>
                    <div className={styles.titleRow}>
                        <img
                            className={styles.icon}
                            src="/currency-icons/wbtc.svg"
                            alt=""
                            width={28}
                            height={28}
                        />
                        <h2>Bridge / BTCX peg</h2>
                        <div className={styles.pills}>
                            <span className={`${styles.pill} ${reservesOk ? styles.pillOk : styles.pillWarn}`}>
                                {reservesOk ? "Reserves OK" : "Reserves check failed"}
                            </span>
                            <span className={`${styles.pill} ${ready ? styles.pillInfo : styles.pillMuted}`}>
                                {ready ? "Bridge ready" : "Bridge pending"}
                            </span>
                        </div>
                    </div>
                </div>
                <p>
                    On-chain BTC in the TSS pool vs circulating BTCX liability (1:1 peg coverage).
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
                    <span>BTC in TSS pool</span>
                    <strong className={styles.mono}>{satsToBtc(pool)} BTC</strong>
                    <em>{formatSats(pool)} sats</em>
                </article>
                <article className={styles.card}>
                    <span>BTCX minted liability</span>
                    <strong className={styles.mono}>{satsToBtc(liability)} BTCX</strong>
                    <em>{formatSats(liability)} sats</em>
                </article>
                <article className={styles.card}>
                    <span>Coverage ratio</span>
                    <strong>{status ? coverage : "—"}</strong>
                    <em>
                        {liability === BigInt(0)
                            ? "No circulating liability"
                            : `${satsToBtc(pool)} / ${satsToBtc(liability)} BTC`}
                    </em>
                </article>
                <article className={styles.card}>
                    <span>Custody</span>
                    <strong>{threshold}-of-{parties} TSS</strong>
                    <em>{status?.tss?.custodyMode || "tss"}</em>
                </article>
            </div>

            <div className={styles.coverage}>
                <div className={styles.coverageHead}>
                    <h3>Peg coverage</h3>
                    <p>
                        {formatSats(pool)} sats pool · {formatSats(liability)} sats liability
                    </p>
                </div>
                <div className={styles.barTrack} aria-hidden>
                    <div className={styles.barFill} style={{ width: `${barPct}%` }} />
                </div>
                <p className={styles.note}>
                    Pool via Esplora address balance; liability from Trade bridge ledger (minted − paid burns).
                    {status?.updatedAt
                        ? ` Updated ${new Date(status.updatedAt * 1000).toISOString()}.`
                        : ""}
                </p>
            </div>

            <div className={styles.panel}>
                <div className={styles.panelHead}>
                    <h3>Track your deposit</h3>
                    <p>
                        Paste your Bitcoin transaction ID to check peg progress.
                        Private by design — no public list of deposits or PDC addresses.
                    </p>
                </div>
                <form className={styles.lookupForm} onSubmit={lookupDeposit}>
                    <label className={styles.lookupLabel} htmlFor="btc-txid">
                        Bitcoin transaction ID
                    </label>
                    <div className={styles.lookupRow}>
                        <input
                            id="btc-txid"
                            className={styles.lookupInput}
                            type="text"
                            inputMode="text"
                            autoComplete="off"
                            spellCheck={false}
                            placeholder="64-character hex txid"
                            value={txidInput}
                            onChange={(ev) => setTxidInput(ev.target.value)}
                        />
                        <button
                            type="submit"
                            className={styles.lookupBtn}
                            disabled={lookupLoading}
                        >
                            {lookupLoading ? "Looking up…" : "Lookup"}
                        </button>
                    </div>
                </form>
                {lookupError && !lookup?.found && (
                    <p className={styles.lookupMsg}>{lookupError}</p>
                )}
                {lookup?.found && (
                    <div className={styles.lookupCard}>
                        <div className={styles.lookupCardHead}>
                            <span className={`${styles.pill} ${statusPillClass(lookup.status)}`}>
                                {lookup.status || "unknown"}
                            </span>
                            {lookup.hint ? <em>{lookup.hint}</em> : null}
                        </div>
                        <table className={styles.table}>
                            <tbody>
                                <tr>
                                    <th>Amount</th>
                                    <td>
                                        {lookup.amountSats != null
                                            ? `${formatSats(toBigInt(lookup.amountSats))} sats (${satsToBtc(toBigInt(lookup.amountSats))} BTC)`
                                            : "—"}
                                    </td>
                                </tr>
                                <tr>
                                    <th>Confirmations</th>
                                    <td>{lookup.confirmations != null ? lookup.confirmations : "—"}</td>
                                </tr>
                                <tr>
                                    <th>Bitcoin tx</th>
                                    <td>
                                        {lookup.btcTxid ? (
                                            <a
                                                href={`https://mempool.space/tx/${lookup.btcTxid}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {lookup.btcTxid}
                                                {lookup.btcVout != null ? `:${lookup.btcVout}` : ""}
                                            </a>
                                        ) : "—"}
                                    </td>
                                </tr>
                                <tr>
                                    <th>Minted tx</th>
                                    <td>{lookup.mintedTxId || "—"}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className={styles.grid}>
                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h3>Pool &amp; policy</h3>
                        <p>Deposit and withdraw limits for the BTC ↔ BTCX peg.</p>
                    </div>
                    <table className={styles.table}>
                        <tbody>
                            <tr>
                                <th>TSS address</th>
                                <td>
                                    <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                                        <CopyButton text={BTCX_TSS_ADDRESS} />
                                        {BTCX_TSS_ADDRESS}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <th>Min deposit</th>
                                <td>
                                    {formatSats(depositMin)} sats
                                    {depositMinUsd != null ? ` (~$${depositMinUsd})` : ""}
                                </td>
                            </tr>
                            <tr>
                                <th>Min withdraw</th>
                                <td>{formatSats(withdrawMin)} sats</td>
                            </tr>
                            <tr>
                                <th>Withdraw network fee</th>
                                <td>{formatSats(withdrawFee)} sats (from burn)</td>
                            </tr>
                            <tr>
                                <th>Deposit network fee</th>
                                <td>Paid by sender on BTC</td>
                            </tr>
                            <tr>
                                <th>Confirmations</th>
                                <td>{confirmations}</td>
                            </tr>
                            <tr>
                                <th>BTCX asset id</th>
                                <td>
                                    {assetId ? (
                                        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                                            <CopyButton text={assetId} />
                                            {assetId}
                                        </span>
                                    ) : "—"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <p className={styles.callout}>
                        Fee policy is peg-neutral: deposit BTC fee is paid by the sender; withdraw BTC fee
                        is deducted from burned BTCX. Operator float is not required.
                    </p>
                </div>

                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h3>Health</h3>
                        <p>Bitcoin node sync and bridge readiness.</p>
                    </div>
                    <table className={styles.table}>
                        <tbody>
                            <tr>
                                <th>bitcoind sync</th>
                                <td>
                                    <span className={`${styles.pill} ${ibd ? styles.pillWarn : styles.pillOk}`}>
                                        {ibd
                                            ? `IBD${ibdPct != null ? ` ~${ibdPct}%` : ""}`
                                            : "Synced"}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <th>Blocks / headers</th>
                                <td>
                                    {sync?.blocks != null && sync?.headers != null
                                        ? `${sync.blocks} / ${sync.headers}`
                                        : "—"}
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
                    <p className={styles.callout}>
                        While IBD runs, payouts may use Esplora broadcast when configured.
                        Source: Trade <code>GET /api/bridge/status</code> via explorer proxy.
                    </p>
                </div>
            </div>

            <p className={styles.note}>
                Deposit tracking uses a private lookup by Bitcoin txid only — there is no public browseable
                list of deposits or destination PDC addresses.
            </p>
        </section>
    );
}

export default BridgePage;

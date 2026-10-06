import { useEffect, useState } from "react";
import styles from "@/styles/NodeHealth.module.scss";
import Fetch from "@/utils/methods";
import Utils from "@/utils/utils";
import { MAINNET_HARDFORKS, HardforkStatus } from "@/config/hardforks";

interface ForkRow {
    id: number;
    label: string;
    name: string;
    afterHeight: number;
    description: string;
    status: HardforkStatus;
}

interface NodeHealthData {
    version: string | null;
    height: number | null;
    networkState: string | null;
    incoming: number | null;
    outgoing: number | null;
    whitePeers: number | null;
    greyPeers: number | null;
    synchronizedConnections: number | null;
    currentFork: { id: number; label: string; name: string } | null;
    forks: ForkRow[];
}

const emptyForks: ForkRow[] = MAINNET_HARDFORKS.map((fork) => ({
    ...fork,
    status: "upcoming",
}));

function countLabel(value: number | null) {
    return value == null ? "—" : Utils.formatNumber(value, 0);
}

const PILL_CLASS: Record<HardforkStatus, string> = {
    past: styles.pillPast,
    active: styles.pillActive,
    upcoming: styles.pillUpcoming,
};

function NodeHealthPage() {
    const [data, setData] = useState<NodeHealthData | null>(null);

    useEffect(() => {
        let stopped = false;

        async function load() {
            try {
                const response = await Fetch.getNodeHealth();
                if (stopped || !response?.success || !response.data) return;
                setData(response.data);
            } catch {
                if (!stopped) setData(null);
            }
        }

        load();
        const timer = setInterval(load, 15000);
        return () => {
            stopped = true;
            clearInterval(timer);
        };
    }, []);

    const forks = data?.forks?.length ? data.forks : emptyForks;
    const version = data?.version ?? "Unavailable";
    const forkLabel = data?.currentFork
        ? `${data.currentFork.label} ${data.currentFork.name}`
        : "—";

    return (
        <section className={styles.page} aria-label="Node health">
            <div className={styles.head}>
                <h2>Node health</h2>
                <p>Daemon version and hard fork history for this PDC node.</p>
            </div>

            <div className={styles.cards}>
                <article className={styles.card}>
                    <span>Daemon version</span>
                    <strong className={styles.version}>{version}</strong>
                    <em>Reported by the connected pdcd</em>
                </article>
                <article className={styles.card}>
                    <span>Network</span>
                    <strong>{data?.networkState ?? "—"}</strong>
                    <em>
                        {countLabel(data?.synchronizedConnections ?? null)} synchronized
                        {" · "}
                        in {countLabel(data?.incoming ?? null)}
                        {" · "}
                        out {countLabel(data?.outgoing ?? null)}
                    </em>
                </article>
                <article className={styles.card}>
                    <span>Current fork</span>
                    <strong>{forkLabel}</strong>
                    <em>
                        White list {countLabel(data?.whitePeers ?? null)}
                        {" · "}
                        grey list {countLabel(data?.greyPeers ?? null)}
                    </em>
                </article>
                <article className={styles.card}>
                    <span>Chain height</span>
                    <strong>{data?.height == null ? "—" : Utils.formatNumber(data.height, 0)}</strong>
                    <em>A fork applies above the listed height</em>
                </article>
            </div>

            <div className={styles.tableWrap}>
                <div className={styles.tableHead}>
                    <h3>Hard fork schedule</h3>
                    <p>Status follows the daemon hard fork flags when they are available.</p>
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>HF</th>
                            <th>Name</th>
                            <th>Active after</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {forks.map((fork) => (
                            <tr key={fork.id} className={fork.status === "active" ? styles.rowActive : undefined}>
                                <td>
                                    <span className={`${styles.pill} ${PILL_CLASS[fork.status]}`}>
                                        {fork.status}
                                    </span>
                                </td>
                                <td>{fork.label}</td>
                                <td className={styles.name}>{fork.name}</td>
                                <td>{Utils.formatNumber(fork.afterHeight, 0)}</td>
                                <td className={styles.desc}>{fork.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className={styles.note}>
                    HF5, HF6, and HF7 share activation after height 1199. The highest active ruleset is marked active.
                </p>
            </div>
        </section>
    );
}

export default NodeHealthPage;

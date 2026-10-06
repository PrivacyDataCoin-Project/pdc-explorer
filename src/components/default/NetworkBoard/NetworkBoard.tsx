import styles from "./NetworkBoard.module.scss";
import { useEffect, useState } from "react";
import Info from "@/interfaces/state/Info";
import Block from "@/interfaces/state/Block";
import VisibilityInfo from "@/interfaces/state/VisibilityInfo";
import Fetch from "@/utils/methods";
import Utils from "@/utils/utils";
import { socket } from "@/utils/socket";
import { NETWORK } from "@/config/network";
import { PoolElement } from "@/components/default/TransactionPool/TransactionPool";

function readPercent(value: string | number | undefined) {
    if (value == null || value === "") return null;
    const parsed = parseFloat(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
}

function average(values: number[]) {
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDuration(seconds: number) {
    const rounded = Math.round(seconds);
    if (rounded < 90) return `${rounded}s`;
    const minutes = Math.floor(rounded / 60);
    const rest = rounded % 60;
    return `${minutes}m ${rest.toString().padStart(2, "0")}s`;
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    return `${(bytes / 1024).toFixed(2)} kB`;
}

function Donut({ value, color, caption }: { value: number | null; color: string; caption: string }) {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const shown = value == null ? 0 : Math.max(0, Math.min(100, value));
    const dash = (shown / 100) * circumference;

    return (
        <div className={styles.donut}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r={radius} className={styles.track} />
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className={styles.arc}
                    stroke={color}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                />
            </svg>
            <div className={styles.donutLabel}>
                <strong>{value == null ? "—" : `${shown.toFixed(1)}%`}</strong>
                <span>{caption}</span>
            </div>
        </div>
    );
}

function NetworkBoard({
    visibilityInfo,
    fetchedInfo,
    fetchedBlocks,
    mempoolCount,
}: {
    visibilityInfo: VisibilityInfo | null;
    fetchedInfo: Info | null;
    fetchedBlocks: Block[];
    mempoolCount: number;
}) {
    const [info, setInfo] = useState<Info | null>(fetchedInfo);
    const [blocks, setBlocks] = useState<Block[]>(fetchedBlocks);
    const [poolCount, setPoolCount] = useState(mempoolCount);

    useEffect(() => {
        function onInfo(data: string) {
            try {
                const parsed = JSON.parse(data);
                if (!parsed?.height) return;
                setInfo(parsed);
            } catch (error) {
                console.error(error);
            }
        }

        function onPool(data: string) {
            try {
                const parsed = JSON.parse(data) as PoolElement[];
                if (Array.isArray(parsed)) setPoolCount(parsed.length);
            } catch (error) {
                console.error(error);
            }
        }

        socket.on("get_info", onInfo);
        socket.on("get_transaction_pool_info", onPool);
        socket.emit("get-socket-info");
        socket.emit("get-socket-pool");
        return () => {
            socket.off("get_info", onInfo);
            socket.off("get_transaction_pool_info", onPool);
        };
    }, []);

    useEffect(() => {
        let stopped = false;

        async function loadBlocks() {
            if (!info?.height) return;
            const heightToRequest = Math.min(info.height, info.database_height || info.height);
            const result = await Fetch.getBlockDetails(Math.max(heightToRequest - 10, 0), 10);
            if (stopped || result.success === false || !(result instanceof Array)) return;
            setBlocks(Utils.transformToBlocks(result, true));
        }

        loadBlocks().catch((error) => console.error(error));
        const interval = setInterval(() => {
            loadBlocks().catch((error) => console.error(error));
        }, 20000);
        return () => {
            stopped = true;
            clearInterval(interval);
        };
    }, [info]);

    const sorted = [...blocks].sort((left, right) => left.height - right.height);
    const gaps = sorted.slice(1).map((block, index) => block.timestamp - sorted[index].timestamp).filter((gap) => gap > 0);
    const avgGap = average(gaps);
    const avgSize = average(blocks.map((block) => block.size).filter((size) => size > 0));
    const posBlocks = blocks.filter((block) => block.type === "PoS").length;
    const posShare = blocks.length ? (posBlocks / blocks.length) * 100 : null;
    const stakedShare = readPercent(visibilityInfo?.percentage);
    const emitted = info ? Utils.toShiftedNumber(info.total_coins, 12) : "—";
    const staked = visibilityInfo ? Utils.toShiftedNumber(visibilityInfo.amount.toString(), 12) : "—";
    const burned = visibilityInfo?.pdc_burned != null ? visibilityInfo.pdc_burned.toFixed(2) : "—";
    const transactions = info ? Utils.formatNumber(info.height + info.tx_count, 0) : "—";

    const facts = [
        { label: "Avg block", value: avgGap == null ? `${NETWORK.targetSeconds}s target` : formatDuration(avgGap) },
        { label: "Avg size", value: avgSize == null ? "—" : formatSize(avgSize) },
        { label: "Transactions", value: transactions },
        { label: "Mempool", value: `${poolCount} tx` },
        { label: "Emitted", value: emitted === "" || emitted === "—" ? "—" : `${emitted} PDC` },
        { label: "Staked est.", value: staked === "" || staked === "—" ? "—" : `${staked} PDC` },
        { label: "Burned", value: burned === "—" ? burned : `${burned} PDC` },
        { label: "Premine", value: `${NETWORK.premine} PDC` },
    ];

    return (
        <section className={styles.board} aria-label="PDC network">
            <div className={styles.head}>
                <h3>Network</h3>
                <p>Supply, recent block mix, and protocol constants for {NETWORK.ticker}.</p>
            </div>
            <div className={styles.layout}>
                <div className={styles.charts}>
                    <Donut value={stakedShare} color="#3bc7ff" caption="Staked" />
                    <Donut value={posShare} color="#3ee0a0" caption="PoS in view" />
                    <div className={styles.legend}>
                        <p><i className={styles.cyan} /> Staked share of emitted supply</p>
                        <p><i className={styles.green} /> PoS share of the latest loaded blocks</p>
                        <p>Addresses start with {NETWORK.addressPrefix}. Reward is {NETWORK.blockReward} PDC.</p>
                    </div>
                </div>
                <div className={styles.facts}>
                    {facts.map((fact) => (
                        <div key={fact.label} className={styles.fact}>
                            <span>{fact.label}</span>
                            <strong>{fact.value}</strong>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default NetworkBoard;

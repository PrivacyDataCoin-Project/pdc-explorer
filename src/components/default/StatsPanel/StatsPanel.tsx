import Info from "../../../interfaces/state/Info";
import VisibilityInfo from "../../../interfaces/state/VisibilityInfo";
import Utils from "../../../utils/utils";
import styles from "./StatsPanel.module.scss";
import { useState, useEffect, useContext } from "react";
import { socket } from "../../../utils/socket";
import { Store } from "@/store/store-reducer";
import { NETWORK } from "@/config/network";

function StatsPanel(props: { visibilityInfo?: VisibilityInfo | null, fetchedInfo: Info | null, noStats?: boolean }) {
    const { state } = useContext(Store);
    const { visibilityInfo, fetchedInfo } = props;

    const [info, setInfo] = useState<Info | null>(fetchedInfo);
    useEffect(() => {
        function onInfo(data: string) {
            try {
                const parsed = JSON.parse(data);
                if (!parsed?.height) return;
                setInfo(parsed);
            } catch (error) {
                console.log(error);
            }
        }

        socket.on("get_info", onInfo);
        socket.emit("get-socket-info");

        return () => {
            socket.off("get_info", onInfo);
        };
    }, []);

    const chainHeight = info?.height || 0;
    const indexedHeight = info?.database_height || 0;
    const infoHeight = info ? (Utils.formatNumber(chainHeight, 0) || "...") : "...";
    const heightHint = indexedHeight > 0 && chainHeight > indexedHeight
        ? `Indexed ${Utils.formatNumber(indexedHeight, 0)} of ${Utils.formatNumber(chainHeight, 0)}`
        : `Next target about ${NETWORK.targetSeconds}s`;
    const posDiff = Utils.toShiftedNumber(info?.pos_difficulty, 0, 0) || "...";
    const powDiff = Utils.formatNumber(info?.pow_difficulty, 0) || "...";
    const transactions = info ? Utils.formatNumber(info.height + info.tx_count, 0) : "...";
    const posValue = visibilityInfo?.pos_value != null
        ? Utils.formatNumber(visibilityInfo.pos_value, 0)
        : "...";
    const coinsEmitted = Utils.toShiftedNumber(info?.total_coins, 12) || "...";
    const hashrate = Utils.toShiftedNumber(info?.current_network_hashrate_350, state.netMode === "TEST" ? 0 : 6, 3) || "...";
    const stakedHint = visibilityInfo?.percentage
        ? `${visibilityInfo.percentage}% staked est.`
        : "No premine";

    const cards = [
        {
            label: "Block height",
            value: info ? infoHeight : "...",
            hint: heightHint,
            tone: "blue",
        },
        {
            label: "PoW hash rate",
            value: info ? `${hashrate} MH/s` : "...",
            hint: `PoS pace ${posValue} blocks/day`,
            tone: "green",
        },
        {
            label: "Coins emitted",
            value: info ? `${coinsEmitted} PDC` : "...",
            hint: stakedHint,
            tone: "cyan",
        },
        {
            label: "Block reward",
            value: `${NETWORK.blockReward} PDC`,
            hint: `${state.netMode === "TEST" ? "Testnet" : "Mainnet"} · ${NETWORK.release}`,
            tone: "gold",
        },
    ];

    const details = [
        { label: "PoS difficulty", value: info ? posDiff : "..." },
        { label: "PoW difficulty", value: info ? powDiff : "..." },
        { label: "Transactions", value: transactions },
        { label: "PoS pace", value: posValue === "..." ? posValue : `${posValue} blocks/day` },
    ];

    return (
        <section className={styles.wrap} aria-label="Network summary">
            <div className={styles.grid}>
                {cards.map((card) => (
                    <article key={card.label} className={`${styles.card} ${styles[card.tone]}`}>
                        <p className={styles.label}>{card.label}</p>
                        <p className={styles.value}>{card.value}</p>
                        <p className={styles.hint}>{card.hint}</p>
                    </article>
                ))}
            </div>
            <div className={styles.details}>
                {details.map((item) => (
                    <div key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default StatsPanel;

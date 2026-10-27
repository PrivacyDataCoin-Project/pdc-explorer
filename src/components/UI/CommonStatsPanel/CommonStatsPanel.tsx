import { nanoid } from "nanoid";
import styles from "./CommonStatsPanel.module.scss";
import { memo } from "react";
import MatrixText from "@/components/UI/MatrixText/MatrixText";


interface Pair {
    key: string,
    value: string
}

interface CommonStatsPanelProps {
    pairs: Pair[];
    className?: string;
}

function StatsItem({ pair, index }: { pair: Pair; index: number }) {
    return (
        <div className={styles["stats-panel__item"]}>
            <div className={styles["stats-panel__item-top"]}>
                <p>{pair.key}</p>
            </div>
            <div className={styles["stats-panel__item-bottom"]}>
                <MatrixText
                    as="h4"
                    value={pair.value}
                    staggerMs={80 + index * 70}
                    duration={800 + index * 40}
                />
            </div>
        </div>
    );
}

const CommonStatsPanel = memo(({ pairs, className }: CommonStatsPanelProps) => {
    return (
        <div className={`${styles["stats-panel"]} ${className || ""}`}>
            {pairs.map((pair, index) => (
                <StatsItem key={nanoid()} pair={pair} index={index} />
            ))}
        </div>
    );
});

export default CommonStatsPanel;
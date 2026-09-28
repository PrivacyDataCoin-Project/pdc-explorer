import Info from "../../../interfaces/state/Info";
import VisibilityInfo from "../../../interfaces/state/VisibilityInfo";
import Utils from "../../../utils/utils";
import styles from "./StatsPanel.module.scss";
import { useState, useEffect, ReactNode, useContext } from "react";
import { socket } from "../../../utils/socket";
import BurnImg from "../../../assets/images/UI/flame_ico.svg";
import { Store } from "@/store/store-reducer";

function StatsPanel(props: { visibilityInfo?: VisibilityInfo | null, fetchedInfo: Info | null, noStats?: boolean }) {
    const { state } = useContext(Store);
    const { visibilityInfo, fetchedInfo } = props;

    const [info, setInfo] = useState<Info | null>(fetchedInfo);
    useEffect(() => {
        socket.on("get_info", (data) => {
            try {
                data = JSON.parse(data);
                if (!data?.height) return;
                setInfo(data);
            } catch (error) {
                console.log(error);
            }
        });

        socket.emit("get-socket-info");

        return () => {
            socket.off("get_info");
        };
    }, []);

    const transactions = info ? info.height + info.tx_count : undefined;

    const infoHeight = Utils.formatNumber(Math.min(info?.height || 0, info?.database_height || 0), 0) || "...";
    const posDiff = Utils.toShiftedNumber(info?.pos_difficulty, 0, 0) || "...";
    const powDiff = Utils.formatNumber(info?.pow_difficulty, 0) || "...";
    const coinsEmitted = Utils.toShiftedNumber(info?.total_coins, 12) || "...";
    const transactionsString = Utils.formatNumber(transactions, 0) || "...";
    const hashrate = Utils.toShiftedNumber(info?.current_network_hashrate_350, state.netMode === "TEST" ? 0 : 9, 2) || "...";

    const stackedCoins = Utils.toShiftedNumber(visibilityInfo?.amount.toString(), 12) || "...";
    const percentage = visibilityInfo?.percentage || "...";
    const APY = visibilityInfo?.apy ? parseFloat((visibilityInfo?.apy || 0).toFixed(4)) : "...";
    const devFund = Utils.toShiftedNumber(visibilityInfo?.balance.toString(), 12) || "...";
    const pdcBurned = visibilityInfo?.pdc_burned?.toFixed(2) ?? "...";
    const posValue = visibilityInfo?.pos_value
        ? Utils.formatNumber(visibilityInfo?.pos_value, 2) || "..."
        : "...";

    function TopItem(props: { title: string, amount: string | ReactNode, percent?: string, customCurrency?: boolean }) {
        const { title, amount, percent, customCurrency } = props;

        const isAmountString = typeof amount === "string";

        return (
            <div className={styles["main__top__item"]}>
                <div>
                    <p className={styles["main__top__item__header"]}>{title}</p>
                </div>
                <div className={styles["item__value"]}>
                    {isAmountString
                        ? <p>{amount + (!customCurrency ? " PDC" : "")}</p>
                        : amount
                    }
                    {percent &&
                        <div className={styles["item__precent"]}>
                            <div>
                                <p>
                                    {percent + "%"}
                                </p>
                            </div>
                            <p className={styles["item__precent__label"]}>from total supply</p>
                        </div>
                    }
                </div>
            </div>
        )
    }

    function BottomItem(props: { title: string, children: React.ReactNode, style?: React.CSSProperties }) {
        const { title, children, style } = props;

        return (
            <div className={styles["main__bottom__item"]} style={style}>
                <div>
                    <p>{title}</p>
                </div>
                <div className={styles["bottom__item__value"]}>
                    {children}
                </div>
            </div>
        )
    }

    function InfoTop() {
        return (
            <div className={styles["info__main__top"]}>
                <TopItem
                    title="Staked Coins (est)"
                    amount={stackedCoins}
                    percent={percentage}
                />
                <TopItem
                    title="Dev Fund"
                    amount={devFund}
                />
                <TopItem
                    title="Real Time APY"
                    amount={`${APY}%`}
                    customCurrency={true}
                />
                <TopItem
                    title="PDC Burned"
                    amount={
                        <div className={styles["item__value__burn"]}>
                            <BurnImg />
                            <div>
                                <p>{pdcBurned} PDC</p>
                            </div>
                        </div>
                    }
                />
            </div>
        );
    }

    return (
        <>
            <div className={styles["blockchain__info__main"]}>
                {state.netMode === "MAIN" && !props.noStats && <InfoTop />}
                <div className={styles["info__main__bottom"]}>
                    <BottomItem title="Height">
                        <p className={styles["item__text__large"]}>{infoHeight}</p>
                    </BottomItem>
                    <BottomItem title="Difficulty">
                        <div className={styles["item__difficulty"]}>
                            <div>
                                <p>PoS: {posDiff}</p>
                            </div>

                            <div>
                                <p>PoW: {powDiff}</p>
                            </div>
                        </div>
                    </BottomItem>
                    <BottomItem title="Coins Emitted">
                        <p className={styles["item__text__small"]}>{coinsEmitted}</p>
                    </BottomItem>
                    <BottomItem title="Transactions">
                        <p className={styles["item__text__large"]}>{transactionsString}</p>
                    </BottomItem>
                    <BottomItem title="Hash Rate (approx):">
                        <div className={styles["item__difficulty"]}>
                            <div>
                                <p>PoS: {posValue} block/day</p>
                            </div>

                            <div>
                                <p>PoW: {hashrate} GH/sec</p>
                            </div>
                        </div>
                    </BottomItem>
                </div>
            </div>

            <div className={styles["info__main__mobile"]}>
                {state.netMode === "MAIN" && <InfoTop />}
                <div className={styles["info__main__bottom"]}>
                    <BottomItem title="Height">
                        <p className={styles["item__text__large"]}>{infoHeight}</p>
                    </BottomItem>
                    <BottomItem title="Difficulty">
                        <div className={styles["item__difficulty"]}>
                            <div>
                                <p>PoS: {posDiff}</p>
                            </div>

                            <div>
                                <p>PoW: {powDiff}</p>
                            </div>
                        </div>
                    </BottomItem>
                    <BottomItem title="Coins Emitted">
                        <p className={styles["item__text__small"]}>{coinsEmitted}</p>
                    </BottomItem>
                    <BottomItem title="Transactions">
                        <p className={styles["item__text__large"]}>{transactionsString}</p>
                    </BottomItem>
                    <BottomItem title="Hash Rate (approx):">
                        <div className={styles["item__difficulty"]}>
                            <div>
                                <p>PoS: {posValue} block/day</p>
                            </div>

                            <div>
                                <p>PoW: {hashrate} GH/sec</p>
                            </div>
                        </div>
                    </BottomItem>
                </div>
            </div>
        </>
    )
}

export default StatsPanel;

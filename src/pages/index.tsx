import styles from "@/styles/Blockchain.module.scss";
import Header from "@/components/default/Header/Header";
import StatsPanel from "@/components/default/StatsPanel/StatsPanel";
import InfoTopPanel from "@/components/default/InfoTopPanel/InfoTopPanel";
import LatestBlocks from "@/components/default/LatestBlocks/LatestBlocks";
import TransactionPool, { PoolElement } from "@/components/default/TransactionPool/TransactionPool";
import { useEffect, useState } from "react";
import Fetch from "@/utils/methods";
import VisibilityInfo from "@/interfaces/state/VisibilityInfo";
import Info from "@/interfaces/state/Info";
import Block, { ExplorerStatusType } from "@/interfaces/state/Block";
import { GetServerSideProps } from "next";
import { getMainPageProps } from "@/utils/ssr";
import { classes } from "@/utils/utils";
export interface MainPageProps {
    visibilityInfo: VisibilityInfo | null;
    isOnline: boolean;
    info: Info | null;
    latestBlocks: Block[];
    txPoolElements: PoolElement[]
    explorerStatus: ExplorerStatusType;
    daemonVersion: string | null;
}

function formatDaemonLabel(version: string) {
    const trimmed = version.trim().replace(/^pdcd\b\s*/i, "");
    return `Daemon version ${trimmed}`;
}

function versionForStatus(status: ExplorerStatusType, version: unknown): string | null {
    if (status === "offline" || typeof version !== "string") return null;
    const trimmed = version.trim();
    return trimmed || null;
}

function MainPage({ visibilityInfo: fetchedVisibilityInfo, explorerStatus: ssrExplorerStatus, daemonVersion: ssrDaemonVersion, info, latestBlocks, txPoolElements }: MainPageProps) {


    console.log('ssrExplorerStatus', ssrExplorerStatus);
    

    const [burgerOpened, setBurgerOpened] = useState(false);

    const [visibilityInfo, setVisibilityInfo] = useState<VisibilityInfo | null>(fetchedVisibilityInfo);
    const [explorerStatus, setExplorerStatus] = useState<ExplorerStatusType>(ssrExplorerStatus);
    const [daemonVersion, setDaemonVersion] = useState<string | null>(versionForStatus(ssrExplorerStatus, ssrDaemonVersion));

    useEffect(() => {
        async function fetchVisibilityInfo() {
            const result = await Fetch.getVisibilityInfo();
            if (result.success === false) return;
            setVisibilityInfo(result);
        }

        async function checkOnline() {
            try {
                const explorerStatus = await Fetch.getExplorerStatus();

                if (explorerStatus.success === false) {
                    setExplorerStatus("offline");
                    setDaemonVersion(null);
                } else {
                    const nextStatus = explorerStatus.data.explorer_status;
                    setExplorerStatus(nextStatus);
                    setDaemonVersion(versionForStatus(nextStatus, explorerStatus.data.daemon_version));
                }

            } catch (error) {
                console.error("Error checking online status:", error);
            }
        }

        fetchVisibilityInfo();
        const interval = setInterval(checkOnline, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles["blockchain"]}>
            <Header
                page="Blockchain"
                burgerOpened={burgerOpened}
                setBurgerOpened={setBurgerOpened}
            />
            <InfoTopPanel
                burgerOpened={burgerOpened}
                title="Blockchain"
                content={
                    <div className={styles["info__top__daemon"]}>
                        <p className={styles["info__top__daemon_item"]}>Explorer state:
                            <span className={classes(styles["explorer__status"], styles[explorerStatus])}>
                                <span className={styles["status__item"]} /> {explorerStatus}
                            </span>
                            {daemonVersion &&
                                <span className={classes(styles["daemon__version"], styles["explorer__status"])}>{formatDaemonLabel(daemonVersion)}</span>
                            }
                        </p>
                        <p className={styles["info__top__daemon_item"]}>Default network fee: 0,01</p>
                        <p className={styles["info__top__daemon_item"]}>Minimum network fee: 0,01</p>
                    </div>
                }
            />
            <StatsPanel visibilityInfo={visibilityInfo} fetchedInfo={info} />
            <LatestBlocks
                fetchedLatestBlocks={latestBlocks}
                fetchedInfo={info}
            />
            <TransactionPool
                fetchedTxPoolElements={txPoolElements}
            />
        </div>
    )
}

const getServerSideProps: GetServerSideProps = getMainPageProps;
export { getServerSideProps };

export default MainPage;
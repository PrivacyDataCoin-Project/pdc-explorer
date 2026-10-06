import AliasText from "@/components/default/AliasText/AliasText";
import Table from "@/components/default/Table/Table";
import Block from "@/interfaces/state/Block";
import Info from "@/interfaces/state/Info";
import Fetch from "@/utils/methods";
import Utils, { classes } from "@/utils/utils";
import styles from "./LatestBlocks.module.scss";
import { ReactNode, useState, useEffect, useRef } from "react";
import Link from "next/link";
import BigNumber from "bignumber.js";
import InfoIcon from "@/assets/images/UI/info.svg";

export const latestBlocksInitState = {
    itemsInPage: 10,
    page: 1,
}

function formatSize(bytes: number) {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(2)} kB`;
}

function formatAge(timestamp: number, now: number) {
    const elapsed = Math.max(0, Math.floor(now / 1000 - timestamp));
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    const pad = (value: number) => value.toString().padStart(2, "0");
    if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    return `${minutes}:${pad(seconds)}`;
}

function LatestBlocks({
    fetchedInfo,
    fetchedLatestBlocks,
    beforeTable,
}: {
    fetchedInfo: Info | null,
    fetchedLatestBlocks: Block[],
    beforeTable?: ReactNode,
}) {
    const [info, setInfo] = useState<Info | null>(fetchedInfo);
    const prevTxCount = useRef<number>(0);
    const [headerStatus, setHeaderStatus] = useState<JSX.Element | null>(null);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);

    useEffect(() => {
        async function fetchInfo() {
            const result = await Fetch.getInfo();
            if (result.success === false) return;
            if (!result.height) return;
            setInfo(result);
        }

        fetchInfo();

        const interval = setInterval(fetchInfo, 20 * 1e3);

        return () => clearInterval(interval);
    }, []);


    const [blocks, setBlocks] = useState<Block[]>(fetchedLatestBlocks);

    const [itemsOnPage, setItemsOnPage] = useState(
        new BigNumber(latestBlocksInitState.itemsInPage).toFixed()
    );
    const [pagesAmount, setPagesAmount] = useState(Math.ceil(((info?.height || 0) - 1) / parseInt(itemsOnPage || "0", 10)));
    const [page, setPage] = useState(
        new BigNumber(latestBlocksInitState.page).toFixed()
    );
    const [goToBlock, setGoToBlock] = useState("");

    useEffect(() => {
        if (!info) return;
        const { height } = info;
        const itemsParsed = parseInt(itemsOnPage || "0", 10);

        function onGoToBlockEnter() {
            if (!goToBlock || !itemsOnPage) return;
            const goToHeight = parseInt(goToBlock || "0", 10);
            if (goToHeight > height - 1) return;
            const offset = height - goToHeight;
            const newPage = Math.ceil(offset / itemsParsed);
            setPage(newPage.toString());
        }

        setPagesAmount(Math.ceil((height - 1) / itemsParsed));

        onGoToBlockEnter();
    }, [goToBlock, info, itemsOnPage]);


    useEffect(() => {
        async function fetchBlocks() {
            try {
                const items = parseInt(itemsOnPage, 10) || 0;
                const pageNumber = parseInt(page, 10) || 0;
                if (pageNumber === 0 || !info) {
                    setHeaderStatus(null);
                    return;
                }

                setHeaderStatus(<>Scanning new transactions...</>);
                await new Promise(resolve => setTimeout(resolve, 1000));
                const { height, database_height } = info;

                const heightToRequest = database_height > 0 ? Math.min(height, database_height) : height;
                const result = await Fetch.getBlockDetails(heightToRequest - items * pageNumber, items);
                if (result.success === false || !(result instanceof Array)) return;

                const transformed = Utils.transformToBlocks(result, true);

                const currentTxCount = transformed.reduce((acc, block) => acc + (block.transactions || 0), 0);
                const prevCount = prevTxCount.current;
                prevTxCount.current = currentTxCount;

                setBlocks(transformed);


                if (currentTxCount > prevCount) {
                    const diff = currentTxCount - prevCount;
                    setHeaderStatus(
                        <>
                            <span>{diff} more transaction{diff > 1 ? "s" : ""}</span> has come in
                        </>
                    );
                } else {
                    setHeaderStatus(null);
                }

                setLastUpdated(+Date.now());
            } catch (error) {
                console.error(error);
                setHeaderStatus(null);
            }
        }

        fetchBlocks();
        const id = setInterval(fetchBlocks, 20 * 1000);
        return () => clearInterval(id);
    }, [info, itemsOnPage, page]);

    const tableHeaders = ["HEIGHT", "TIMESTAMP (UTC)", "AGE", "SIZE", "TRANSACTIONS", "HASH"];

    const tableElements = blocks.map(e => {
        const hash = e.hash;
        const hashLink = hash ? "/block/" + hash : "/";
        return [
            <p>
                <Link href={hashLink}>{e.height}</Link>
                {` (${e.type})`}
            </p>,
            Utils.formatTimestampUTC(e.timestamp),
            <span suppressHydrationWarning>{Utils.timeElapsedString(e.timestamp)}</span>,
            `${e.size} bytes`,
            e.transactions?.toString() || "0",
            <AliasText href={hashLink}>{hash}</AliasText>
        ]
    });

    const [now, setNow] = useState(() => Date.now());
    const [lastUpdatedText, setLastUpdatedText] = useState<string | undefined>(undefined);

    useEffect(() => {
        function formatLastUpdated() {
            setLastUpdatedText(lastUpdated ? Utils.timeElapsedString(lastUpdated / 1000, true) : undefined);
        }

        formatLastUpdated();
        const interval = setInterval(() => {
            formatLastUpdated();
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(interval);

    }, [lastUpdated]);

    const stream = blocks.slice(0, 12);

    return (
        <div className={styles.stack}>
            <section className={styles.stream} aria-label="Live block stream">
                <div className={styles.streamHead}>
                    <h3>
                        <span className={styles.liveDot} />
                        Live block stream
                    </h3>
                    {lastUpdatedText && <span className={styles.updated} suppressHydrationWarning>Updated {lastUpdatedText}</span>}
                </div>
                <div className={styles.rail}>
                    {stream.length === 0 && (
                        <p className={styles.emptyStream}>Blocks appear here when the PDC daemon is connected.</p>
                    )}
                    {stream.map((block) => (
                        <Link key={block.hash || block.height} href={block.hash ? `/block/${block.hash}` : "/"} className={styles.blockCard}>
                            <span className={block.type === "PoS" ? styles.pos : styles.pow}>{block.type}</span>
                            <strong>#{block.height}</strong>
                            <em>{block.hash ? `${block.hash.slice(0, 10)}…` : "—"}</em>
                            <span>TXs {block.transactions || 0}</span>
                            <span>Size {formatSize(block.size)}</span>
                            <span suppressHydrationWarning>{formatAge(block.timestamp, now)}</span>
                        </Link>
                    ))}
                </div>
            </section>
            {beforeTable}
            <div id="blocks" className={classes(styles["blockchain__latest_blocks"], styles["custom-scroll"])}>
            <h3 className={styles["blockchain__latest_blocks__title"]}>
                All blocks
                {lastUpdated && (
                    <span className={styles["status__badge"]} suppressHydrationWarning><InfoIcon /> Last updated {lastUpdatedText}</span>
                )}
            </h3>

            <Table
                headerStatus={headerStatus}
                pagination
                headers={tableHeaders}
                elements={tableElements}
                itemsOnPage={itemsOnPage}
                setItemsOnPage={setItemsOnPage}
                page={page}
                setPage={setPage}
                goToBlock={goToBlock}
                setGoToBlock={setGoToBlock}
                pagesTotal={pagesAmount}
            // goToBlockEnter={onGoToBlockEnter}
            />
        </div>
        </div>
    )
}

export default LatestBlocks;
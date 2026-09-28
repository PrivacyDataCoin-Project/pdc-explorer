import AliasText from "@/components/default/AliasText/AliasText";
import Table from "@/components/default/Table/Table";
import Block from "@/interfaces/state/Block";
import Info from "@/interfaces/state/Info";
import Fetch from "@/utils/methods";
import Utils, { classes } from "@/utils/utils";
import styles from "./LatestBlocks.module.scss";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import BigNumber from "bignumber.js";
import InfoIcon from "@/assets/images/UI/info.svg";

export const latestBlocksInitState = {
    itemsInPage: 10,
    page: 1,
}

function LatestBlocks({ fetchedInfo, fetchedLatestBlocks }: { fetchedInfo: Info | null, fetchedLatestBlocks: Block[] }) {
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
                setHeaderStatus(<>Scanning new transactions...</>);
                await new Promise(resolve => setTimeout(resolve, 1000));

                const items = parseInt(itemsOnPage, 10) || 0;
                const pageNumber = parseInt(page, 10) || 0;
                if (pageNumber === 0 || !info) return;
                const { height, database_height } = info;

                const heightToRequest = Math.min(height, database_height);
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
            Utils.timeElapsedString(e.timestamp),
            `${e.size} bytes`,
            e.transactions?.toString() || "0",
            <AliasText href={hashLink}>{hash}</AliasText>
        ]
    });

    const [lastUpdatedText, setLastUpdatedText] = useState<string | undefined>(undefined);

    useEffect(() => {
        function formatLastUpdated() {
            setLastUpdatedText(lastUpdated ? Utils.timeElapsedString(lastUpdated / 1000, true) : undefined);
        }

        formatLastUpdated();
        const interval = setInterval(formatLastUpdated, 1000);
        return () => clearInterval(interval);

    }, [lastUpdated]);


    return (
        <div className={classes(styles["blockchain__latest_blocks"], styles["custom-scroll"])}>
            <h3 className={styles["blockchain__latest_blocks__title"]}>
                Latest Blocks 
                {lastUpdated && (
                    <span className={styles["status__badge"]}><InfoIcon /> Last updated {lastUpdatedText}</span>
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
    )
}

export default LatestBlocks;
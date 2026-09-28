import styles from "@/styles/AltBlocks.module.scss";
import { useState, useEffect } from "react";
import Header from "@/components/default/Header/Header";
import InfoTopPanel from "@/components/default/InfoTopPanel/InfoTopPanel";
import Table from "@/components/default/Table/Table";
import AliasText from "@/components/default/AliasText/AliasText";
import Block from "@/interfaces/state/Block";
import Fetch from "@/utils/methods";
import Utils from "@/utils/utils";
import Link from "next/link";

function AltBlocks() {
    const [burgerOpened, setBurgerOpened] = useState(false);

    const [altBlocks, setAltBlocks] = useState<Block[]>([]);

    const [itemsOnPage, setItemsOnPage] = useState("10");
    const [page, setPage] = useState("1");

    useEffect(() => {
        async function fetchAltBlocks() {
            const currentPage = parseInt(page, 10) || 0;
            const itemsAmount = parseInt(itemsOnPage, 10) || 0;
            const result = await Fetch.getAltBlocksInfo((currentPage - 1) * itemsAmount, itemsAmount);

            if (result.sucess === false) return;
            if (!(result instanceof Array)) return;
            setAltBlocks(
                Utils.transformToBlocks(result, false, true)
            );
        }

        fetchAltBlocks();

        const id = setInterval(fetchAltBlocks, 20 * 1e3);

        return () => clearInterval(id);
    }, [itemsOnPage, page]);

    const tableHeaders = ["HEIGHT", "TIMESTAMP (UTC)", "ACTIAL TIMESTAMP (UTC)", "SIZE", "TRANSACTIONS", "HASH"];

    const tableElements = altBlocks.map(e => {
        const hash = e.hash;
        const hashLink = hash ? "/alt-blocks/" + hash : "/";

        return [
            <p>
                <Link href={hashLink}>{e.height}</Link>
                {` (${e.type})`}
            </p>,
            Utils.formatTimestampUTC(e.timestamp),
            Utils.formatTimestampUTC(e.timestamp),
            `${e.size} bytes`,
            e.transactions?.toString() || "0",
            <AliasText href={hashLink}>{e.hash}</AliasText>
        ]
    });

    return (
        <div className={styles["alt_blocks"]}>
            <Header
                page="Alt-blocks"
                burgerOpened={burgerOpened}
                setBurgerOpened={setBurgerOpened}
            />
            <InfoTopPanel
                burgerOpened={burgerOpened}
                title="Alt-blocks"
            />
            <div className={`${styles["alt_blocks__table"]} custom-scroll`}>
                <Table
                    headers={tableHeaders}
                    elements={tableElements}
                    pagination
                    hidePaginationBlock
                    itemsOnPage={itemsOnPage}
                    setItemsOnPage={setItemsOnPage}
                    page={page}
                    setPage={setPage}
                />
            </div>
        </div>
    )
}

export default AltBlocks;

import styles from "@/styles/Block.module.scss";
import Header from "@/components/default/Header/Header";
import InfoTopPanel from "@/components/default/InfoTopPanel/InfoTopPanel";
import StatsPanel from "@/components/default/StatsPanel/StatsPanel";
import { useEffect, useState } from "react";
import Table from "@/components/default/Table/Table";
import ArrowImg from "@/assets/images/UI/arrow.svg";
import BlockInfo from "@/interfaces/common/BlockInfo";
import Utils from "@/utils/utils";
import Link from "next/link";
import Fetch from "@/utils/methods";
import Popup from "@/components/default/Popup/Popup";
import { useRouter } from "next/router";
import { getStats, BlockPageProps, getBlock } from "@/utils/ssr";
import { GetServerSideProps } from "next";

interface Transaction {
    hash: string;
    amount: string;
    fee: string;
    size: string;
}

interface BlockProps extends BlockPageProps {
    alt?: boolean;
}

function Block(props: BlockProps) {
    const { alt } = props;

    const [burgerOpened, setBurgerOpened] = useState(false);
    const [jsonPopupOpened, setJsonPopupOpened] = useState(false);

    const router = useRouter();
    const { hash: hashQuery } = router.query;

    const hash = Array.isArray(hashQuery) ? hashQuery[0] : hashQuery;

    const tableHeaders = ["HASH", "FEE", "TOTAL AMOUNT", "SIZE"];

    const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(props.blockData?.blockInfo || null);
    const [transactions, setTransactions] = useState<Transaction[]>(props.blockData?.transactionsDetails || []);

    const tableElements = transactions.map(e => [
        !alt
            ? (
                <Link href={"/transaction/" + (e.hash || "")} className={styles["block__table__hash"]}>
                    {e.hash}
                </Link>
            )
            : (
                <p className={styles["block__table__hash"]}>{e.hash}</p>
            ),
        e.fee,
        e.amount,
        e.size + " bytes"
    ]);

    const [height, setHeight] = useState<number | null>(props.blockData?.height ?? null);
    const [prevHash, setPrevHash] = useState<string | null>(null);
    const [nextHash, setNextHash] = useState<string | null>(null);

    useEffect(() => {
        async function fetchHash() {
            if (height === null) return;
            const prevHashFetched = await Fetch.getHashByHeight(height - 1);
            const nextHashFetched = await Fetch.getHashByHeight(height + 1);
            setPrevHash(prevHashFetched);
            setNextHash(nextHashFetched);
        }

        fetchHash();
    }, [height]);

    useEffect(() => {
        async function fetchBlock() {

            if (!hash) {
                return;
            }

            const blockData = await Utils.fetchBlock(hash, alt);

            if (!blockData) {
                return;
            }

            setBlockInfo(blockData.blockInfo || null);
            setTransactions(blockData.transactionsDetails);
            setHeight(blockData.height);

        }

        fetchBlock();
    }, [hash]);

    function BlockInfo() {

        function JsonPopup() {
            return (
                <div className={styles["block__info__json"]}>
                    {/* <button>x</button> */}
                    <div className={styles["block__info__json__content"]}>
                        {blockInfo?.object_in_json || ''}
                    </div>
                </div>
            );
        }

        return (
            <div className={styles["block__info"]}>
                {jsonPopupOpened &&
                    <Popup
                        Content={JsonPopup}
                        close={() => setJsonPopupOpened(false)}
                        settings={{

                        }}
                        scroll
                        blur
                        classList={[styles["block__json_popup"]]}
                    />
                }
                <div className={styles["block__info__title"]}>
                    <h2>PDC Block</h2>
                    <div>
                        {!alt && prevHash !== "" &&
                            <Link href={prevHash ? "/block/" + prevHash : "/"}>
                                <ArrowImg />
                            </Link>
                        }
                        <h2>{height}</h2>
                        {!alt && nextHash !== "" &&
                            <Link href={nextHash ? "/block/" + nextHash : "/"}>
                                <ArrowImg />
                            </Link>
                        }
                    </div>
                    <p>{hash?.toUpperCase() || ""}</p>
                </div>
                <div className={styles["block__info__table"]}>
                    <table>
                        <tbody>
                            <tr>
                                <td>Type:</td>
                                <td>
                                    <span
                                        className={`${styles["block__info__type"]} ${blockInfo?.type === "PoS" ? styles["type__pos"] : styles["type__pow"]}`}
                                    >
                                        {blockInfo?.type ?? "-"}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td>Timestamp (UTC):</td>
                                <td>{blockInfo?.timestamp ? Utils.formatTimestampUTC(+new Date(parseInt(blockInfo?.timestamp, 10))) : "-"}</td>
                            </tr>
                            <tr>
                                <td>ID</td>
                                <td><Link href="/">{Utils.shortenAddress(blockInfo?.tx_id ?? "-")}</Link></td>
                            </tr>
                            <tr>
                                <td>Actual Timestamp (UTC):</td>
                                <td>{blockInfo?.actualTimestamp ? Utils.formatTimestampUTC(parseInt(blockInfo?.actualTimestamp.toString(), 10)) : "-"}</td>
                            </tr>
                            <tr>
                                <td>Difficulty:</td>
                                <td>{blockInfo?.difficulty ?? "-"}</td>
                            </tr>
                            <tr>
                                <td>Miner text info:</td>
                                <td>{blockInfo?.minerTextInfo ?? "-"}</td>
                            </tr>
                            <tr>
                                <td>Cumulative diff adjusted:</td>
                                <td>{blockInfo?.cummulativeDiffAdjusted ?? "-"}</td>
                            </tr>
                            <tr>
                                <td>Cumulative diff presize:</td>
                                <td>{blockInfo?.cummulativeDiffPresize ?? "-"}</td>
                            </tr>
                            <tr>
                                <td>Orphan:</td>
                                <td>{blockInfo?.orphan ? "yes" : "no"}</td>
                            </tr>
                            <tr>
                                <td>Base reward:</td>
                                <td>{blockInfo?.baseReward ?? "-"}</td>
                            </tr>
                            <tr>
                                <td>Transactions fee:</td>
                                <td>{blockInfo?.transactionsFee ?? "-"}</td>
                            </tr>
                            <tr>
                                <td>Major / Minor versions:</td>
                                <td>{blockInfo?.major_version ?? "-"} / {blockInfo?.minor_version ?? "-"}</td>
                            </tr>
                        </tbody>
                    </table>
                    <table>
                        <tbody>
                            <tr>
                                <td>Reward penalty:</td>
                                <td>{blockInfo?.rewardPenalty ?? "-"}</td>
                            </tr>
                            <tr>
                                <td>Reward:</td>
                                <td>{blockInfo?.reward || "-"}</td>
                            </tr>
                            <tr>
                                <td>Previous ID:</td>
                                <td><Link href={`/block/${blockInfo?.prev_id}`}>{Utils.shortenAddress(blockInfo?.prev_id ?? "-")}</Link></td>
                            </tr>
                            <tr>
                                <td>Total block size, bytes:</td>
                                <td>{blockInfo?.totalBlockSize ?? "-"}</td>
                            </tr>
                            <tr>
                                <td>Effective txs median, bytes:</td>
                                <td>{blockInfo?.effectiveTxsMedian ?? "-"}</td>
                            </tr>
                            <tr>
                                <td>This block fee median</td>
                                <td>{blockInfo?.blockFeeMedian ?? "-"}</td>
                            </tr>
                            <tr>
                                <td>Effective fee median</td>
                                <td>{blockInfo?.effectiveFeeMedian ?? "-"}</td>
                            </tr>
                            <tr>
                                <td>Current txs median, bytes:</td>
                                <td>{blockInfo?.currentTxsMedian ?? "-"}</td>
                            </tr>
                            <tr>
                                <td>Transactions:</td>
                                <td>{blockInfo?.transactions ?? "-"}</td>
                            </tr>
                            <tr>
                                <td>Total transactions size, bytes:</td>
                                <td>{blockInfo?.transactionsSize ?? "-"}</td>
                            </tr>
                            <tr>
                                <td>Seed</td>
                                <td>{blockInfo?.seed ?? ""}</td>
                            </tr>
                            <tr>
                                <td>JSON data:</td>
                                <td>
                                    <Link
                                        href="/"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setJsonPopupOpened(true);
                                        }}
                                    >
                                        [ &nbsp;view &nbsp;]
                                    </Link>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        )
    }

    return (
        <div className={styles["block"]}>
            <Header
                page="Blockchain"
                burgerOpened={burgerOpened}
                setBurgerOpened={setBurgerOpened}
            />
            <InfoTopPanel
                burgerOpened={burgerOpened}
                title=""
                back
                className={styles["block__info__top"]}
            />
            <StatsPanel noStats={true} visibilityInfo={props.visibilityInfo} fetchedInfo={props.info} />
            <BlockInfo />
            <div className={styles["block__transactions"]}>
                <h2>Transactions</h2>
                <Table
                    headers={tableHeaders}
                    elements={tableElements}
                />
            </div>
        </div>
    )
}

const getServerSideProps: GetServerSideProps = getBlock;
export { getServerSideProps };

export default Block;

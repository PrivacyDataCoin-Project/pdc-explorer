import styles from "@/styles/Transaction.module.scss";
import { useEffect, useState } from "react";
import Header from "@/components/default/Header/Header";
import InfoTopPanel from "@/components/default/InfoTopPanel/InfoTopPanel";
import StatsPanel from "@/components/default/StatsPanel/StatsPanel";
import Table from "@/components/default/Table/Table";
import TransactionInfo, { Input } from "@/interfaces/common/TransactionInfo";
import Fetch from "@/utils/methods";
import Link from "next/link";
import Utils from "@/utils/utils";
import { nanoid } from "nanoid";
import Popup from "@/components/default/Popup/Popup";
import CrossImg from "@/assets/images/UI/cross.svg";
import Button from "@/components/UI/Button/Button";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { getTransaction, TransactionPageProps } from "@/utils/ssr";

interface Block {
    hash: string;
    height: string;
    timestamp: string;
}

function Transaction({
    visibilityInfo,
    info,
    transactionsData
}: TransactionPageProps) {

    const [burgerOpened, setBurgerOpened] = useState(false);

    const [transactionInfo, setTransactionInfo] = useState<TransactionInfo | null>(transactionsData?.transactionInfo || null);
    const [blockOrigin, setBlockOrigin] = useState<Block | null>(transactionsData?.blockOrigin || null);

    const [popupState, setPopupState] = useState(false);
    const [selectedInput, setSelectedInput] = useState<Input | null>(null);

    const router = useRouter();

    const { hashQuery } = router.query;

    const hash = Array.isArray(hashQuery) ? hashQuery[0] : hashQuery;



    const fetchTransaction = Utils.fetchTransaction;

    useEffect(() => {
        async function fetchTransactionInfo() {

            if (!hash) {
                return;
            }

            const transactionInfo = await fetchTransaction(hash);

            if (transactionInfo) {
                setTransactionInfo(transactionInfo?.transactionInfo);
                setBlockOrigin(transactionInfo?.blockOrigin);
            }
        }

        fetchTransactionInfo();
    }, [hash]);

    function showIndexesClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, input: Input) {
        event.preventDefault();
        setSelectedInput(input);
        setPopupState(true);
    }

    async function onIndexClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, amount: number, index: number) {
        event.preventDefault();
        const result = await Fetch.getOutInfo(amount, index);
        if (result.tx_id && typeof result.tx_id === "string") {
            router.push("/transaction/" + result.tx_id);
            setPopupState(false);
        }
    }

    const insRows = transactionInfo ? (
        transactionInfo.ins.map(e => [
            e.amount,
            e.keyimage,
            e.globalIndexes.length,
            e.globalIndexes.length > 1 ?
                (
                    <Link href="/" onClick={event => showIndexesClick(event, e)}>Show all...</Link>
                )
                :
                (
                    <Link
                        href="/"
                        onClick={event => onIndexClick(event, e.amount, e.globalIndexes[0])}
                    >
                        {e.globalIndexes[0] ?? ""}
                    </Link>
                )
        ])
    ) : [];

    const outsRows = transactionInfo ? (
        transactionInfo.outs.map(e => [
            e.amount,
            <div className={styles["transaction__outs__keys"]}>
                {e.publicKeys.map(e => <p>{e}</p>)}
            </div>,
            e.globalIndex
        ])
    ) : [];

    function GlobalIndexesPopup({ close }: { close: () => void; }) {
        const popupIndexes = selectedInput?.globalIndexes || [];
        const amount = selectedInput?.amount || 0;

        return (
            <div className={styles["transaction__indexes__popup"]}>
                <h3>
                    Input ring set ({popupIndexes.length})
                </h3>
                <div>
                    {popupIndexes.map(e =>
                    (
                        <Link
                            href="/"
                            key={e}
                            onClick={event => onIndexClick(event, amount, e)}
                        >
                            {e}
                        </Link>
                    )
                    )}
                </div>
                <Button
                    wrapper
                    className={styles["popup__cross"]}
                    onClick={close}
                >
                    <CrossImg />
                </Button>
            </div>
        )
    }

    return (
        <div className={styles["transaction"]}>
            <Header
                burgerOpened={burgerOpened}
                setBurgerOpened={setBurgerOpened}
                page="Blockchain"
            />
            <InfoTopPanel
                burgerOpened={burgerOpened}
                title=""
                back
                className={styles["block__info__top"]}
            />
            <StatsPanel noStats={true} visibilityInfo={visibilityInfo} fetchedInfo={info} />

            {transactionInfo?.confirmations ? <>
                <div className={styles["transaction__info"]}>
                    <h2>Transaction</h2>
                    <table>
                        <tbody>
                            <tr>
                                <td>Hash</td>
                                <td>{transactionInfo?.hash || "-"}</td>
                            </tr>
                            <tr>
                                <td>Amount</td>
                                <td>{transactionInfo?.amount || "-"}</td>
                            </tr>
                            <tr>
                                <td>Fee</td>
                                <td>{transactionInfo?.fee || "-"}</td>
                            </tr>
                            <tr>
                                <td>Size</td>
                                <td>{(transactionInfo?.size || "0") + " bytes"}</td>
                            </tr>
                            <tr className={styles["transaction__confirmation"] + (!transactionInfo?.confirmations ? ` ${styles["transaction__unconfirmed"]}` : '')}>
                                <td>Confirmations</td>
                                <td>{transactionInfo?.confirmations || "Unconfirmed"}</td>
                            </tr>
                            <tr>
                                <td>One-time public key</td>
                                <td>{transactionInfo?.publicKey || "-"}</td>
                            </tr>
                            <tr>
                                <td>Mixin</td>
                                <td>{transactionInfo?.mixin || "-"}</td>
                            </tr>
                            <tr className={styles["transaction__extra_items"]}>
                                <td>Extra items</td>
                                <td>
                                    {
                                        transactionInfo?.extraItems.map((e, i) =>
                                            <p key={nanoid(16)}>
                                                {`[${i + 1}] ` + e}
                                            </p>
                                        )
                                    }
                                </td>
                            </tr>
                            <tr>
                                <td>Attachments</td>
                                <td>{transactionInfo?.attachments || "-"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className={styles["transaction__table__wrapper"]}>
                    <h3>From Block</h3>
                    <Table
                        className={styles["custom-scroll"]}
                        headers={["HASH", "HEIGHT", "TIMESTAMP (UTC)"]}
                        elements={[[
                            <Link
                                className={styles["table__hash"]}
                                href={blockOrigin?.hash ? "/block/" + blockOrigin.hash : "/"}
                            >
                                {blockOrigin?.hash}
                            </Link>,
                            blockOrigin?.height || "",
                            blockOrigin?.timestamp ? Utils.formatTimestampUTC(parseInt(blockOrigin.timestamp, 10)) : ""
                        ]]}
                        columnsWidth={[65, 15, 20]}
                    />
                </div>

                <div className={styles["transaction__table__wrapper"]}>
                    <h3>{`Inputs ( ${insRows.length} )`}</h3>
                    <Table
                        className={`${styles["transaction__table__inputs"]} ${styles["custom-scroll"]}`}
                        headers={["AMOUNT", "IMAGE / MULTISIG ID", "DECOY COUNT", "GLOBAL INDEX"]}
                        elements={insRows}
                        columnsWidth={[15, 50, 15, 20]}
                    />
                </div>

                <div className={styles["transaction__table__wrapper"]}>
                    <h3>{`Outputs ( ${outsRows.length} )`}</h3>
                    <Table
                        className={styles["custom-scroll"]}
                        headers={["AMOUNT", "KEY", "GLOBAL INDEX / MULTISIG ID"]}
                        elements={outsRows}
                        columnsWidth={[15, 65, 20]}
                        textWrap
                    />
                </div>
            </> 
            : 
            <div className={styles.notFound}>
               [Not found]
            </div>
            }

            {popupState &&
                <Popup
                    Content={GlobalIndexesPopup}
                    settings={{}}
                    close={() => setPopupState(false)}
                    blur
                />
            }
        </div>
    )
}

const getServerSideProps: GetServerSideProps = getTransaction;
export { getServerSideProps };

export default Transaction;
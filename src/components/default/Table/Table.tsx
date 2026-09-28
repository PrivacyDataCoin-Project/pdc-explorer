import styles from "./Table.module.scss";
import ArrowImg from "../../../assets/images/UI/arrow.svg";
import { nanoid } from "nanoid";
import Input from "../../UI/Input/Input";
import TableProps from "./Table.props";
import Preloader from "@/components/UI/Preloader/Preloader";

function Table(props: TableProps) {
    function onNumberInput(event: React.FormEvent<HTMLInputElement>, setState?: React.Dispatch<React.SetStateAction<string>>, max?: number) {
        if (!setState) return;
        const newValue = event.currentTarget.value;
        if (newValue !== "" && !newValue.match(/^\d+$/)) return event.preventDefault();
        if (max) {
            const number = parseInt(newValue, 10) || 0;
            if (number > max) return setState(max.toString());
        }
        setState(newValue);
    }

    const {
        headers,
        headerStatus,
        elements,
        pagination,
        className,
        hidePaginationBlock,
        itemsOnPage,
        setItemsOnPage,
        page,
        setPage,
        goToBlock,
        setGoToBlock,
        goToBlockEnter,
        columnsWidth,
        textWrap,
        pagesTotal,
        isLoading = false
    } = props;

    function changePage(increase: number) {
        if (!page || !setPage) return;
        const pageNumber = parseInt(page, 10);
        setPage(Math.max(1, pageNumber + increase).toString());
    }

    return (
        <div className={className}>
            {!isLoading ? <>
                <table className={`${styles.table} ${!textWrap ? styles["table__text_nowrap"] : ""}`}>
                    <thead>
                        <tr>
                            {
                                headers.map(e => <th key={nanoid(16)}>{e}</th>)
                            }
                        </tr>
                        {headerStatus && <tr className={styles.table__info_status}>
                            <th colSpan={headers.length}>{headerStatus}</th>
                        </tr>}
                    </thead>
                    <tbody>
                        {elements.map(row =>
                            <tr key={nanoid(16)}>
                                {
                                    row.map((e, i) =>
                                        <td
                                            style={columnsWidth ? { width: `${columnsWidth[i]}%` } : undefined}
                                            key={nanoid(16)}
                                        >
                                            {e}
                                        </td>
                                    )
                                }
                            </tr>
                        )}

                    </tbody>
                </table>
                <Pagination pagination={pagination} />
            </> : <div className={styles.preloader}>
                <Preloader />
            </div>}

        </div>
    )

    function Pagination({ pagination }: { pagination: boolean | undefined }) {
        if (!pagination) return null
        return <div className={styles["table__pagination"]}>
            <div className={styles["table__pagination__pages"]}>
                <p>Pages: </p>
                <div>
                    <button
                        className={page === "1" ? styles.disabled : undefined}
                        onClick={() => changePage(-1)}
                    >
                        <ArrowImg />
                    </button>
                    <button
                        onClick={() => changePage(1)}
                    >
                        <ArrowImg />
                    </button>
                </div>
                <Input
                    type="text"
                    value={page}
                    onInput={(e) => onNumberInput(e, setPage)}
                />
            </div>
            {pagesTotal && <p>Pages total: {pagesTotal}</p>}
            <div className={styles["table__pagination__blocks"]}>
                <div>
                    <p>Items on page: </p>
                    <Input
                        type="text"
                        value={itemsOnPage}
                        onInput={(e) => onNumberInput(e, setItemsOnPage, 50)}
                    />
                </div>
                {!hidePaginationBlock &&
                    <div>
                        <p>Go to block: </p>
                        <Input
                            type="text"
                            placeholder="number"
                            value={goToBlock}
                            onInput={(e) => onNumberInput(e, setGoToBlock)}
                            onEnterPress={goToBlockEnter}
                        />
                    </div>
                }
            </div>
        </div>
    }
}

export default Table;
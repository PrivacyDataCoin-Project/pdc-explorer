import { Dispatch, ReactNode, SetStateAction } from "react";

interface TableProps {
    headers: string[];
    headerStatus?: ReactNode | null;
    elements: React.ReactNode[][];
    pagination?: boolean;
    hidePaginationBlock?: boolean;
    className?: string;
    itemsOnPage?: string;
    setItemsOnPage?: Dispatch<SetStateAction<string>>;
    page?: string;
    setPage?: Dispatch<SetStateAction<string>>;
    goToBlock?: string;
    setGoToBlock?: Dispatch<SetStateAction<string>>;
    goToBlockEnter?: () => void;
    columnsWidth?: number[];
    textWrap?: boolean;
    pagesTotal?: number;
    isLoading?: boolean;
}

export default TableProps;
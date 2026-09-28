import styles from "@/styles/Asset.module.scss";
import { useState } from "react";
import Header from "@/components/default/Header/Header";
import InfoTopPanel from "@/components/default/InfoTopPanel/InfoTopPanel";
import Table from "@/components/default/Table/Table";

export default function Asset() {
    const [burgerOpened, setBurgerOpened] = useState(false);
    
    const assetsRows = [
        ["Ticker", "PDC"],
        ["Name", "PDC"],
        ["Description", "Privacy Data Coin"],
        ["Decimal Point", "12"],
        ["Block Reward", "1 PDC"],
        ["Premine", "0"],
        ["Target", "60 seconds"],
        ["Address prefix", "Px"],
        ["Genesis", "df35cba557c857756f20612ce3c9d2aa315d0ae8fc2aaffe6c5c59d37e00b10a"],
    ]

    return (
        <div>
            <Header
                page="Assets" 
                burgerOpened={burgerOpened} 
                setBurgerOpened={setBurgerOpened} 
            />
            <InfoTopPanel
                burgerOpened={burgerOpened} 
                title=""
                back
                className={styles["block__info__top"]}
            />
            <Table 
                columnsWidth={[50, 50]}
                headers={["NAME", "AMOUNT"]}
                elements={assetsRows}
                className={styles["asset__table"]}
            />
        </div>
    )
}
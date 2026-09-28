import Button from "../Button/Button";
import styles from "./Switch.module.scss";
import { Dispatch, SetStateAction } from "react";

interface SwitchProps {
    titles: string[];
    selectedTitleIdx: number;
    setSelectedTitleIdx: Dispatch<SetStateAction<number>>;
}

export default function Switch({
    titles,
    selectedTitleIdx,
    setSelectedTitleIdx
}: SwitchProps) {
    return ( 
        <div className={styles['switch']}>
        {titles.map((title, idx) => {
        
            return (
            <Button 
                key={idx}
                wrapper
                className={`${styles["switch__item"]} ${(idx === selectedTitleIdx) && styles["switch__item_selected"] }`}
                onClick={() => setSelectedTitleIdx(idx)}
        >
                <p>{title}</p>
        </Button> 
        )
        
    })}
    </div>
    ) 
}
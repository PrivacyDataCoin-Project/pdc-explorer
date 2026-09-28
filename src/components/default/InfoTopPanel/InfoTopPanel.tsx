import Button from "@/components/UI/Button/Button";
import Input from "@/components/UI/Input/Input";
import styles from "./InfoTopPanel.module.scss";
import SearchImg from "@/assets/images/UI/search.svg";
import BackImg from "@/assets/images/UI/back.svg";
import { useState } from "react";
import Fetch from "@/utils/methods";
import Link from "next/link";
import InfoTopPanelProps from "./InfoTopPanel.props";
import { useRouter } from 'next/router'

function InfoTopPanel(props: InfoTopPanelProps) {
    const { burgerOpened, title, content, back, className, inputParams, contentNotHiding, inputDefaultClosed } = props;

    const router = useRouter(); 

    const [inputClosed, setInputClosed] = useState(inputDefaultClosed || false);
    const [inputState, setInputState] = useState("");

    const [noMatch, setNoMatch] = useState(false);

    async function onButtonClick() {
        if (!inputState) return;
        const input = inputState.replace(/\s/g, '');

        const searchInfo = await Fetch.searchById(input);

        if (searchInfo && typeof searchInfo === "object") {
            const result = searchInfo.result;
            if (result === "tx") {
                return router.push("/transaction/" + input);
            }
            if (result === "block") {
                return router.push("/block/" + input);
            }

            const txByKeyimageRes = await Fetch.getTxByKeyimage(input);

            if (txByKeyimageRes && typeof txByKeyimageRes === "object" && txByKeyimageRes.data) {
                return router.push("/transaction/" + input);
            }

            if (input.match(/^\d+$/)) {
                try {
                    const parsedHash = await Fetch.getHashByHeight(parseInt(input, 10));
                    if (parsedHash) {
                        return router.push("/block/" + parsedHash);
                    }
                } catch {
                    return setNoMatch(true);
                }
            } else {
                return setNoMatch(true);
            }
        }
    }

    async function onBackClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
        event.preventDefault();
        router.back();
    }
    return (
        <div 
            className={
                `${styles.blockchain__info__top} ${className} ${inputClosed ? styles.blockchain__input__closed : ""} ${burgerOpened ? styles.info__top__hidden : ""}`
            }
        >

            {back &&
                <Link href="/" onClick={onBackClick}>
                    <div className={styles.info__back}>
                        <BackImg />
                        <p>Back</p>
                    </div>
                </Link>
            }
            <div className={styles.info__top__title}>
                <h4 className={contentNotHiding ? styles.hiding_element : undefined}>{title}</h4>
                {!back &&
                    <div className={`${styles.info__top__content} ${!contentNotHiding ? styles.hiding_element : ""}`}>
                        {
                            content || <></>
                        }
                    </div>    
                }
            </div>
            
            
            
            <div className={styles.info__top__input}>
                {noMatch && <p>No matching records found!</p> }
                {!inputParams ?
                    <Input 
                        placeholder="block height / block hash / transaction hash" 
                        value={inputState}
                        onInput={event => {
                            setInputState(event.currentTarget.value);
                            setNoMatch(false);
                        }}
                        onEnterPress={inputState ? onButtonClick : undefined}
                    /> :
                    <Input
                        placeholder={inputParams.placeholder}
                        value={inputParams.state}
                        onInput={event => {
                            inputParams.setState(event.currentTarget.value);
                        }}
                    />
                }
                
                <Button 
                    onClick={inputState ? onButtonClick : () => setInputClosed(!inputClosed)}
                >
                    <SearchImg />
                </Button>
            </div>
        </div>
    )
}

export default InfoTopPanel;
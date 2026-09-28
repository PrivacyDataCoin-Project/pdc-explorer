import styles from "./JSONPopup.module.scss";
import Popup from "../Popup/Popup";
import JSONPopupProps from "./JSONPopup.props";
import JsonViewStyled from "../../UI/JsonViewStyled/JsonViewStyled";
import Button from "../../UI/Button/Button";
import CrossImg from "../../../assets/images/UI/cross.svg";

const JSONPopup = (props: JSONPopupProps) => {
    const {
        popupState,
        setPopupState,
        json,
        bottomContent,
        hideJson
    } = props;

    function onClose() {
        setPopupState(false);
        if (props.onClose) {
            props.onClose();
        }
    }

    function PopupContent({ close }: { close: () => void }) {
        return (
            <div className={styles["json_popup__content"]}>
                {!hideJson && 
                    <div className={styles["json_popup__content__json"]}>
                        <JsonViewStyled 
                            data={json} 
                        />
                    </div>
                }
                <Button
                    wrapper
                    onClick={close}
                    className={styles["json_popup__close_btn"]}
                >
                    <CrossImg />
                </Button>
                {bottomContent}
            </div>
        )
    }

    return (
        popupState ?
            <Popup 
                Content={PopupContent}
                settings={{}}
                close={onClose}
                blur
            /> : 
            <></>
    )
};

export default JSONPopup;
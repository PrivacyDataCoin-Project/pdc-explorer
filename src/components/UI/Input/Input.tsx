import styles from "./Input.module.scss";

interface InputProps extends React.HTMLProps<HTMLInputElement> {
    onEnterPress?: () => void;
}

function Input(props: InputProps) {
    const { onEnterPress, ...restProps } = props;

    function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (props.onKeyDown) props.onKeyDown(event);
        if (!onEnterPress) return;
        if (event.key === 'Enter' || event.keyCode === 13) {
            onEnterPress();
        }
    }

    return (
        <input 
            {...restProps}
            onKeyDown={onKeyDown}
            className={`${styles["input"]} ${props.className ? styles[props.className] : ""}`}
        />
    )
}

export default Input;
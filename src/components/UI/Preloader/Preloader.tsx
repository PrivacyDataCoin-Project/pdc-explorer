import styles from "./Preloader.module.scss";

function Preloader(props: { className?: string }) {
    const { className } = props;

    return (
        <div className={styles["lds-ellipsis"] + " " + (className || "")}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    );
}

export default Preloader;
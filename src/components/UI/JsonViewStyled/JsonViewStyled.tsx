import styles from "./JsonViewStyled.module.scss";
import { JsonView, darkStyles, Props } from "react-json-view-lite";
import 'react-json-view-lite/dist/index.css';

function JsonViewStyled(props: Props) {
    return (
        <JsonView 
            {...props}
            style={{
                ...darkStyles,
                container: styles["json__container"], 
                basicChildStyle: styles["json__element"],
                numberValue: styles["json__number"]
            }}
        />
    )
}

export default JsonViewStyled;

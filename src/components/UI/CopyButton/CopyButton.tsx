import styles from "@/components/UI/CopyButton/CopyButton.module.scss";
import Button from "@/components/UI/Button/Button";
import CopyImg from "@/assets/images/UI/copy.svg";
import { useState } from "react";


export default function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    function onClick() {
        if (copied) return;
        navigator.clipboard.writeText(text);
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 250);
    }

    return (
        <Button className={copied ? styles["copy-button_copied"] : undefined} onClick={onClick} wrapper>
            <CopyImg />
        </Button>
    );
}

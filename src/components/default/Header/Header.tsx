import styles from "./Header.module.scss";
import BurgerImg from "../../../assets/images/UI/burger.svg";
import HeaderProps from "./Header.props";
import Button from "../../UI/Button/Button";
import Link from "next/link";
import { useContext } from "react";
import { Store } from "@/store/store-reducer";
import { NETWORK } from "@/config/network";

function Header(props: HeaderProps) {
    const { state } = useContext(Store);
    const { page, burgerOpened, setBurgerOpened } = props;

    const { netMode } = state;
    const otherNetUrl = netMode === "TEST"
        ? process.env.NEXT_PUBLIC_MAINNET_EXPLORER
        : process.env.NEXT_PUBLIC_TESTNET_EXPLORER;

    function Nav({ className }: { className?: string }) {
        return (
            <nav className={className}>
                <Link
                    className={page === "Blockchain" ? "selected" : undefined}
                    href="/"
                >
                    Blockchain
                </Link>
                <Link
                    className={page === "Alt-blocks" ? "selected" : undefined}
                    href="/alt-blocks"
                >
                    Alt-blocks
                </Link>
                <Link
                    className={page === "Aliases" ? "selected" : undefined}
                    href="/aliases"
                >
                    Aliases
                </Link>
                <Link
                    className={page === "Assets" ? "selected" : undefined}
                    href="/assets"
                >
                    Assets
                </Link>
                <Link
                    className={page === "Charts" ? "selected" : undefined}
                    href="/charts"
                >
                    Charts
                </Link>
                <Link
                    className={page === "API" ? "selected" : undefined}
                    href="/pdc_api"
                >
                    API
                </Link>
                <Link
                    href={NETWORK.protocolRepo}
                    target="_blank"
                    rel="noreferrer"
                >
                    Source
                </Link>
            </nav>
        )
    }

    return (
        <header className={styles["header"]}>
            <div className={styles["header__top"]}>
                <div className={styles["header__top__main"]}>
                    <Link href="/" className={styles.logo}>
                        <img src="/pdc-logo.png" alt="PDC" />
                    </Link>
                    <Nav />
                </div>

                <div className={styles["header__top__right"]}>
                    {otherNetUrl &&
                        <Link
                            className={styles["header__switch_btn"]}
                            href={otherNetUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Button>
                                <p>Switch to {netMode === "TEST" ? "Main Net" : "Test Net"}</p>
                            </Button>
                        </Link>
                    }
                    <Button
                        onClick={() => setBurgerOpened(!burgerOpened)}
                        className={styles["header__burger__button"]}
                    >
                        <BurgerImg />
                    </Button>
                </div>
            </div>
            {burgerOpened && <Nav className={styles["header__nav__mobile"]} />}
        </header>
    )
}

export default Header;

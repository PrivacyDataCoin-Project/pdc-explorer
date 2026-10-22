import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./BridgeTabs.module.scss";

const TABS = [
    { href: "/bridge-pdcx", label: "Bridge PDCx", icon: "/currency-icons/pdcx.png" },
    { href: "/bridge", label: "Bridge BTCX", icon: "/currency-icons/wbtc.svg" },
    { href: "/bridge-arqx", label: "Bridge ARQX", icon: "/currency-icons/arq.png" },
] as const;

export default function BridgeTabs() {
    const router = useRouter();
    const path = router.pathname;

    return (
        <div className={styles.tabs} role="tablist" aria-label="Bridge peg">
            {TABS.map((tab) => {
                const active = path === tab.href;
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        role="tab"
                        aria-selected={active}
                        className={`${styles.tab} ${active ? styles.active : ""}`}
                    >
                        <img className={styles.icon} src={tab.icon} alt="" width={16} height={16} aria-hidden />
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}

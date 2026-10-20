import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./BridgeTabs.module.scss";

const TABS = [
    { href: "/bridge", label: "Bridge BTCX" },
    { href: "/bridge-arqx", label: "Bridge ARQX" },
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
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}

import styles from "./AppShell.module.scss";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useContext, useEffect, useState } from "react";
import Fetch from "@/utils/methods";
import { Store } from "@/store/store-reducer";
import { NETWORK } from "@/config/network";
import { ExplorerStatusType } from "@/interfaces/state/Block";

const MAIN_LINKS = [
    { href: "/", label: "Dashboard", icon: "grid" },
    { href: "/node-health", label: "Node Health", icon: "health" },
];

const EXPLORER_LINKS = [
    { href: "/#blocks", label: "Blocks", icon: "blocks" },
    { href: "/#mempool", label: "Mempool", icon: "pool" },
    { href: "/alt-blocks", label: "Alt-blocks", icon: "alt" },
    { href: "/aliases", label: "Aliases", icon: "alias" },
    { href: "/assets", label: "Assets", icon: "asset" },
    { href: "/charts", label: "Charts", icon: "chart" },
    { href: "/pdc_api", label: "API", icon: "api" },
];

function cleanDaemonVersion(version: unknown): string | null {
    if (typeof version !== "string") return null;
    const trimmed = version.trim().replace(/^pdcd\b\s*/i, "").replace(/\[\]$/, "");
    return trimmed || null;
}

function isActive(href: string, pathname: string) {
    if (href.includes("#")) return false;
    if (href === "/") return pathname === "/";
    if (href === "/charts") return pathname === "/charts" || pathname.startsWith("/chart/");
    if (href === "/assets") return pathname === "/assets" || pathname.startsWith("/asset");
    return pathname === href || pathname.startsWith(`${href}/`);
}

function Icon({ name }: { name: string }) {
    const common = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", "aria-hidden": true as const };
    if (name === "grid") {
        return (
            <svg {...common}>
                <rect x="1.5" y="1.5" width="5" height="5" rx="1.2" stroke="currentColor" />
                <rect x="9.5" y="1.5" width="5" height="5" rx="1.2" stroke="currentColor" />
                <rect x="1.5" y="9.5" width="5" height="5" rx="1.2" stroke="currentColor" />
                <rect x="9.5" y="9.5" width="5" height="5" rx="1.2" stroke="currentColor" />
            </svg>
        );
    }
    if (name === "blocks") {
        return (
            <svg {...common}>
                <path d="M2 4.5 8 1.5l6 3v7L8 14.5 2 11.5v-7Z" stroke="currentColor" />
                <path d="M2 4.5 8 7.5l6-3M8 7.5V14.5" stroke="currentColor" />
            </svg>
        );
    }
    if (name === "pool") {
        return (
            <svg {...common}>
                <path d="M2 11.5h12M3.5 8.5h9M5 5.5h6" stroke="currentColor" strokeLinecap="round" />
            </svg>
        );
    }
    if (name === "alt") {
        return (
            <svg {...common}>
                <path d="M3 12.5 8 3.5l5 9" stroke="currentColor" strokeLinejoin="round" />
                <path d="M5.2 9.5h5.6" stroke="currentColor" />
            </svg>
        );
    }
    if (name === "alias") {
        return (
            <svg {...common}>
                <circle cx="8" cy="5.5" r="2.2" stroke="currentColor" />
                <path d="M3.5 13c.7-2.2 2.3-3.3 4.5-3.3s3.8 1.1 4.5 3.3" stroke="currentColor" strokeLinecap="round" />
            </svg>
        );
    }
    if (name === "asset") {
        return (
            <svg {...common}>
                <circle cx="8" cy="8" r="5.5" stroke="currentColor" />
                <path d="M8 5.2v5.6M6.2 6.6h2.6a1.3 1.3 0 0 1 0 2.6H6.8" stroke="currentColor" strokeLinecap="round" />
            </svg>
        );
    }
    if (name === "chart") {
        return (
            <svg {...common}>
                <path d="M2 12.5h12" stroke="currentColor" strokeLinecap="round" />
                <path d="M3.5 10 6 7.2l2.2 2L12.5 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    if (name === "health") {
        return (
            <svg {...common}>
                <path d="M1.5 8h2.4l1.2-3.2L7.2 12l1.6-4H14.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    return (
        <svg {...common}>
            <path d="M4 5.5h8M4 8h8M4 10.5h5" stroke="currentColor" strokeLinecap="round" />
        </svg>
    );
}

function AppShell({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
    const router = useRouter();
    const { state } = useContext(Store);
    const [query, setQuery] = useState("");
    const [noMatch, setNoMatch] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [status, setStatus] = useState<ExplorerStatusType>("offline");
    const [daemonVersion, setDaemonVersion] = useState<string | null>(null);

    const otherNetUrl = state.netMode === "TEST"
        ? process.env.NEXT_PUBLIC_MAINNET_EXPLORER
        : process.env.NEXT_PUBLIC_TESTNET_EXPLORER;

    useEffect(() => {
        let stopped = false;

        async function checkStatus() {
            try {
                const explorerStatus = await Fetch.getExplorerStatus();
                if (stopped) return;
                if (explorerStatus.success === false) {
                    setStatus("offline");
                    setDaemonVersion(null);
                    return;
                }
                const nextStatus = explorerStatus.data.explorer_status;
                setStatus(nextStatus);
                setDaemonVersion(nextStatus === "offline" ? null : cleanDaemonVersion(explorerStatus.data.daemon_version));
            } catch {
                if (!stopped) {
                    setStatus("offline");
                    setDaemonVersion(null);
                }
            }
        }

        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => {
            stopped = true;
            clearInterval(interval);
        };
    }, []);

    async function onSearch(event?: FormEvent) {
        event?.preventDefault();
        const input = query.replace(/\s/g, "");
        if (!input) return;
        setNoMatch(false);

        try {
            const searchInfo = await Fetch.searchById(input);
            if (searchInfo && typeof searchInfo === "object") {
                const result = searchInfo.result;
                if (result === "tx") {
                    onNavigate();
                    await router.push(`/transaction/${input}`);
                    return;
                }
                if (result === "block") {
                    onNavigate();
                    await router.push(`/block/${input}`);
                    return;
                }
            }

            const txByKeyimageRes = await Fetch.getTxByKeyimage(input);
            if (txByKeyimageRes && typeof txByKeyimageRes === "object" && txByKeyimageRes.data) {
                onNavigate();
                await router.push(`/transaction/${input}`);
                return;
            }

            if (/^\d+$/.test(input)) {
                const parsedHash = await Fetch.getHashByHeight(parseInt(input, 10));
                if (parsedHash) {
                    onNavigate();
                    await router.push(`/block/${parsedHash}`);
                    return;
                }
            }
        } catch {
            setNoMatch(true);
            return;
        }

        setNoMatch(true);
    }

    function NavGroup({ title, links }: { title: string; links: typeof EXPLORER_LINKS }) {
        return (
            <div className={styles.group}>
                <p className={styles.groupLabel}>{title}</p>
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={isActive(link.href, router.pathname) ? styles.linkActive : styles.link}
                        onClick={onNavigate}
                    >
                        <Icon name={link.icon} />
                        <span>{link.label}</span>
                    </Link>
                ))}
            </div>
        );
    }

    return (
        <aside className={`${styles.sidebar} ${open ? styles.open : ""} ${collapsed ? styles.collapsed : ""}`}>
            <div className={styles.brandRow}>
                <Link href="/" className={styles.logo} onClick={onNavigate}>
                    <img src="/pdc-logo.png" alt="PDC" />
                </Link>
                <button
                    type="button"
                    className={styles.collapse}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    onClick={() => setCollapsed((value) => !value)}
                >
                    ×
                </button>
            </div>

            <form className={styles.search} onSubmit={onSearch}>
                <input
                    aria-label="Search block, transaction, or height"
                    placeholder="Search block, tx, height..."
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setNoMatch(false);
                    }}
                />
                {noMatch && <p className={styles.noMatch}>No matching records found</p>}
            </form>

            <nav className={styles.nav}>
                <NavGroup title="Main" links={MAIN_LINKS} />
                <NavGroup title="Explorer" links={EXPLORER_LINKS} />
            </nav>

            <div className={styles.bottom}>
                <p className={styles.network}>
                    <span className={`${styles.dot} ${styles[status]}`} />
                    {state.netMode === "TEST" ? "Testnet" : "Mainnet"}{daemonVersion ? ` · ${daemonVersion}` : ""}
                </p>
                {otherNetUrl && (
                    <a className={styles.switchNet} href={otherNetUrl} target="_blank" rel="noreferrer">
                        Switch to {state.netMode === "TEST" ? "Mainnet" : "Testnet"}
                    </a>
                )}
                <div className={styles.metaLinks}>
                    <a href={NETWORK.website} target="_blank" rel="noreferrer">Website</a>
                    <a href={NETWORK.uiRepo} target="_blank" rel="noreferrer">Wallet</a>
                </div>
            </div>
        </aside>
    );
}

export default AppShell;

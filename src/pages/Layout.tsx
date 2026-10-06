import { useState } from "react";
import Footer from "@/components/default/Footer/Footer";
import AppShell from "@/components/default/AppShell/AppShell";
import styles from "./Layout.module.scss";

export default function Layout({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <div className={styles.frame}>
            <AppShell open={open} onNavigate={() => setOpen(false)} />
            {open && (
                <button
                    type="button"
                    className={styles.backdrop}
                    aria-label="Close menu"
                    onClick={() => setOpen(false)}
                />
            )}
            <div className={styles.main}>
                <button type="button" className={styles.menu} onClick={() => setOpen(true)}>
                    Menu
                </button>
                <div className={styles.page}>{children}</div>
                <Footer />
            </div>
        </div>
    );
}

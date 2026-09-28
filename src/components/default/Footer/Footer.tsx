import { classes } from '@/utils/utils';
import styles from './Footer.module.scss';
import Link from 'next/link';
import { NETWORK } from '@/config/network';

type SelectedLink =
    "home" |
    "protocol" |
    "wallet" |
    "site" |
    "explorer";

const links: {
    title: string;
    type: SelectedLink;
    link: string;
}[] = [
    {
        title: "Website",
        type: "home",
        link: NETWORK.website
    },
    {
        title: "Explorer",
        type: "explorer",
        link: "/"
    },
    {
        title: "Protocol",
        type: "protocol",
        link: NETWORK.protocolRepo
    },
    {
        title: "Wallet UI",
        type: "wallet",
        link: NETWORK.uiRepo
    },
    {
        title: "Site source",
        type: "site",
        link: NETWORK.siteRepo
    }
];

const selectedLink: SelectedLink = "explorer";

function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.footer__refs}>
                {links.map(e => (
                    <Link
                        className={
                            classes(
                                (e.type === selectedLink) && styles.footer__ref_selected
                            )
                        }
                        key={e.type}
                        href={e.link}
                        rel="noopener noreferrer"
                    >
                        {e.title}
                    </Link>
                ))}
            </div>
            <div className={styles.footer__copyright}>
                <p>Copyright © {(new Date()).getFullYear()} Privacy Data Coin</p>
                <p className={styles.genesis}>Genesis {NETWORK.genesis}</p>
            </div>
        </footer>
    );
}

export default Footer;

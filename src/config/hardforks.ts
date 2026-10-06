export type HardforkStatus = "past" | "active" | "upcoming";

export interface HardforkDef {
    id: number;
    label: string;
    name: string;
    afterHeight: number;
    description: string;
}

const SHARED: Omit<HardforkDef, "afterHeight">[] = [
    {
        id: 0,
        label: "v0",
        name: "Genesis",
        description: "Chain start. Initial block rules.",
    },
    {
        id: 1,
        label: "v1",
        name: "Unlock times",
        description: "Coinbase outputs may use different unlock times. Mainnet comment: 2019-09-21.",
    },
    {
        id: 2,
        label: "v2",
        name: "Ruleset 2",
        description: "Protocol ruleset 2. Mainnet comment: 2021-04-05.",
    },
    {
        id: 3,
        label: "v3",
        name: "HTLC",
        description: "HTLC outputs are accepted from this height. Mainnet comment: 2021-06-01.",
    },
    {
        id: 4,
        label: "v4",
        name: "Zarcanum",
        description: "Confidential amounts, hidden assets, and transaction version 2. Mandatory decoy set size is 15. Mainnet comment: 2024-03-21.",
    },
    {
        id: 5,
        label: "v5",
        name: "Asset format",
        description: "Asset operations use the HF5 format. Minimum daemon build 4. Activates with HF6 and HF7.",
    },
    {
        id: 6,
        label: "v6",
        name: "Ruleset 6",
        description: "Activates with HF5 and HF7. Minimum daemon build 4.",
    },
    {
        id: 7,
        label: "v7",
        name: "Current rules",
        description: "Highest ruleset. Activates with HF5 and HF6. Minimum daemon build 4.",
    },
];

const MAINNET_HEIGHTS = [0, 20, 40, 60, 100, 1199, 1199, 1199];
const TESTNET_HEIGHTS = [0, 0, 0, 0, 100, 1199, 1199, 1199];

function withHeights(heights: number[]): HardforkDef[] {
    return SHARED.map((fork, index) => ({
        ...fork,
        afterHeight: heights[index],
    }));
}

export const MAINNET_HARDFORKS = withHeights(MAINNET_HEIGHTS);
export const TESTNET_HARDFORKS = withHeights(TESTNET_HEIGHTS);

export function hardforkSchedule(netMode?: string): HardforkDef[] {
    return netMode === "TEST" ? TESTNET_HARDFORKS : MAINNET_HARDFORKS;
}

export function annotateHardforks(
    forks: HardforkDef[],
    height: number | null,
    flags: boolean[] | null,
) {
    const active = forks.map((fork, index) => {
        if (flags && typeof flags[index] === "boolean") return flags[index];
        if (fork.id === 0) return height != null;
        if (height == null) return false;
        return height > fork.afterHeight;
    });

    let current = -1;
    active.forEach((on, index) => {
        if (on) current = index;
    });

    return forks.map((fork, index) => ({
        ...fork,
        status: (!active[index]
            ? "upcoming"
            : index === current
                ? "active"
                : "past") as HardforkStatus,
    }));
}

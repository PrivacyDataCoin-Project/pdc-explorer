import { annotateHardforks, hardforkSchedule } from "../../src/config/hardforks";
import { get_info } from "./pdcd";

const NETWORK_STATE = [
    "Connecting",
    "Synchronizing",
    "Online",
    "Loading core",
    "Internal error",
    "Unloading core",
    "Downloading database",
];

function asCount(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function getNodeHealth() {
    const response = await get_info().then((result) => result.data).catch(() => null);
    const info = response?.result ?? null;
    const height = asCount(info?.height);
    const rawFlags = info?.is_hardfok_active;
    const flags = Array.isArray(rawFlags) ? rawFlags.map((flag) => Boolean(flag)) : null;
    const stateIndex = asCount(info?.daemon_network_state);
    const forks = annotateHardforks(
        hardforkSchedule(process.env.NET_MODE),
        height,
        flags,
    );
    const current = [...forks].reverse().find((fork) => fork.status === "active") ?? null;

    return {
        version: typeof info?.version === "string" && info.version.trim() ? info.version.trim() : null,
        height,
        networkState: stateIndex == null ? null : (NETWORK_STATE[stateIndex] ?? "Unknown"),
        incoming: asCount(info?.incoming_connections_count),
        outgoing: asCount(info?.outgoing_connections_count),
        whitePeers: asCount(info?.white_peerlist_size),
        greyPeers: asCount(info?.grey_peerlist_size),
        synchronizedConnections: asCount(info?.synchronized_connections_count),
        currentFork: current
            ? { id: current.id, label: current.label, name: current.name }
            : null,
        forks,
    };
}

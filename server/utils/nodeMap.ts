import { execFile } from "child_process";
import { promisify } from "util";
import { NETWORK } from "../../src/config/network";
import { get_info } from "./pdcd";

const execFileAsync = promisify(execFile);
const GEO_CACHE_MS = 60_000;

export interface NodePin {
    lat: number;
    lon: number;
    city: string;
    country: string;
    countryCode: string;
    count: number;
}

export interface NodeMapPayload {
    connected: number;
    whitePeers: number;
    greyPeers: number;
    incoming: number;
    outgoing: number;
    nodes: NodePin[];
    countries: { country: string; countryCode: string; count: number }[];
}

interface GeoHit {
    status?: string;
    country?: string;
    countryCode?: string;
    city?: string;
    lat?: number;
    lon?: number;
}

let geoCache: { key: string; at: number; nodes: NodePin[]; countries: NodeMapPayload["countries"] } | null = null;

function isPublicIpv4(ip: string) {
    const parts = ip.split(".").map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return false;
    if (a === 192 && b === 168) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 169 && b === 254) return false;
    return true;
}

async function connectedPeerIps(port: number) {
    try {
        const { stdout } = await execFileAsync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:ESTABLISHED"], {
            timeout: 4000,
        });
        const ips = new Set<string>();
        for (const line of stdout.split("\n")) {
            if (!line.includes("pdcd")) continue;
            const match = line.match(/->(\d{1,3}(?:\.\d{1,3}){3}):\d+/);
            if (!match || !isPublicIpv4(match[1])) continue;
            ips.add(match[1]);
        }
        return [...ips];
    } catch {
        return [];
    }
}

async function locatePeers(ips: string[]) {
    const key = [...ips].sort().join(",");
    if (geoCache && geoCache.key === key && Date.now() - geoCache.at < GEO_CACHE_MS) {
        return { nodes: geoCache.nodes, countries: geoCache.countries };
    }
    if (!ips.length) {
        return { nodes: [], countries: [] };
    }

    const response = await fetch("http://ip-api.com/batch?fields=status,country,countryCode,city,lat,lon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ips.map((query) => ({ query }))),
        signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { nodes: [], countries: [] };

    const hits = await response.json() as GeoHit[];
    const grouped = new Map<string, NodePin>();
    for (const hit of hits) {
        if (hit.status !== "success" || typeof hit.lat !== "number" || typeof hit.lon !== "number") continue;
        const place = `${hit.lat.toFixed(2)},${hit.lon.toFixed(2)}`;
        const existing = grouped.get(place);
        if (existing) {
            grouped.set(place, { ...existing, count: existing.count + 1 });
            continue;
        }
        grouped.set(place, {
            lat: hit.lat,
            lon: hit.lon,
            city: hit.city || "Unknown",
            country: hit.country || "Unknown",
            countryCode: hit.countryCode || "",
            count: 1,
        });
    }

    const nodes = [...grouped.values()];
    const byCountry = new Map<string, { country: string; countryCode: string; count: number }>();
    for (const node of nodes) {
        const current = byCountry.get(node.country);
        byCountry.set(node.country, {
            country: node.country,
            countryCode: node.countryCode,
            count: (current?.count || 0) + node.count,
        });
    }
    const countries = [...byCountry.values()].sort((left, right) => right.count - left.count);
    geoCache = { key, at: Date.now(), nodes, countries };
    return { nodes, countries };
}

export async function getNodeMap(): Promise<NodeMapPayload> {
    const info = await get_info().then((response) => response.data?.result).catch(() => null);
    const ips = await connectedPeerIps(NETWORK.p2pPort);
    let located = { nodes: [] as NodePin[], countries: [] as NodeMapPayload["countries"] };
    try {
        located = await locatePeers(ips);
    } catch {
        located = { nodes: [], countries: [] };
    }

    const incoming = Number(info?.incoming_connections_count) || 0;
    const outgoing = Number(info?.outgoing_connections_count) || 0;
    return {
        connected: ips.length || incoming + outgoing,
        whitePeers: Number(info?.white_peerlist_size) || 0,
        greyPeers: Number(info?.grey_peerlist_size) || 0,
        incoming,
        outgoing,
        nodes: located.nodes,
        countries: located.countries,
    };
}

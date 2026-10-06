import styles from "./NodeMap.module.scss";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import Fetch from "@/utils/methods";

interface NodePin {
    lat: number;
    lon: number;
    city: string;
    country: string;
    countryCode: string;
    count: number;
}

interface NodeMapData {
    connected: number;
    whitePeers: number;
    greyPeers: number;
    incoming: number;
    outgoing: number;
    nodes: NodePin[];
    countries: { country: string; countryCode: string; count: number }[];
}

const emptyMap: NodeMapData = {
    connected: 0,
    whitePeers: 0,
    greyPeers: 0,
    incoming: 0,
    outgoing: 0,
    nodes: [],
    countries: [],
};

function NodeMap() {
    const frame = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<NodeMapData>(emptyMap);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        let stopped = false;

        async function load() {
            try {
                const result = await Fetch.getNodeMap();
                if (stopped || !result?.success || !result.data) return;
                setData(result.data);
            } catch (error) {
                console.error(error);
            }
        }

        load();
        const interval = setInterval(load, 30_000);
        return () => {
            stopped = true;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const element = frame.current;
        if (!mounted || !element) return;
        let map: LeafletMap | null = null;
        let cancelled = false;

        async function draw() {
            const leaflet = await import("leaflet");
            if (cancelled || !frame.current) return;
            map = leaflet.map(frame.current, {
                zoomControl: true,
                attributionControl: true,
                minZoom: 1,
                worldCopyJump: true,
            });
            leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap",
                maxZoom: 8,
            }).addTo(map);
            map.setView([24, 10], 2);

            data.nodes.forEach((node) => {
                if (!map) return;
                const marker = leaflet.circleMarker([node.lat, node.lon], {
                    radius: 6 + Math.min(node.count, 6),
                    color: "#9af6ff",
                    weight: 1,
                    fillColor: "#3bc7ff",
                    fillOpacity: 0.9,
                });
                marker.bindTooltip(`${node.city}, ${node.country} · ${node.count}`, {
                    direction: "top",
                    opacity: 0.95,
                });
                marker.addTo(map);
            });
        }

        draw().catch((error) => console.error(error));
        return () => {
            cancelled = true;
            map?.remove();
        };
    }, [data, mounted]);

    const countryCount = data.countries.length;

    return (
        <section className={styles.panel} aria-label="Global node map">
            <div className={styles.head}>
                <h3>Global node map</h3>
                <p>Peers connected to this PDC daemon. Addresses stay off the map.</p>
            </div>
            <div className={styles.stats}>
                <div>
                    <span>Connected</span>
                    <strong>{data.connected}</strong>
                </div>
                <div>
                    <span>White list</span>
                    <strong>{data.whitePeers}</strong>
                </div>
                <div>
                    <span>Grey list</span>
                    <strong>{data.greyPeers}</strong>
                </div>
                <div>
                    <span>Countries</span>
                    <strong>{countryCount}</strong>
                </div>
            </div>
            <div className={styles.body}>
                {mounted ? <div ref={frame} className={styles.map} /> : <div className={styles.map} />}
                <aside className={styles.countries}>
                    <p>Nodes by country</p>
                    {data.countries.length === 0 && <span>Locations appear when peers can be placed.</span>}
                    {data.countries.map((country) => (
                        <div key={country.country}>
                            <span>{country.countryCode ? `${country.countryCode} · ${country.country}` : country.country}</span>
                            <strong>{country.count}</strong>
                        </div>
                    ))}
                </aside>
            </div>
        </section>
    );
}

export default NodeMap;

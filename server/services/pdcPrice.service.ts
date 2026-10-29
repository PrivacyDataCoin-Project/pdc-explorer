import axios from "axios";
import PdcPrice from "../schemes/PdcPrice";
import { config } from "../utils/utils";
import { oraclePricesUsdUrl, readOracleBookPrice } from "../../src/utils/pure";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

async function fetchOraclePdcSpot(): Promise<{ timestamp: number; price: string; raw: object } | null> {
	const url = oraclePricesUsdUrl(config.trade_api_url);
	const res = await axios.get(url, { timeout: 15000 });
	const prices = (res.data?.prices && typeof res.data.prices === "object")
		? res.data.prices as Record<string, unknown>
		: null;
	const usd = readOracleBookPrice(prices, "PDC");
	if (usd === undefined) return null;

	const updatedAt = Number(res.data?.updatedAt);
	let timestamp = Date.now();
	if (Number.isFinite(updatedAt) && updatedAt > 0) {
		timestamp = updatedAt > 1e12 ? Math.trunc(updatedAt) : Math.trunc(updatedAt * 1000);
	}

	return {
		timestamp,
		price: String(usd),
		raw: {
			source: res.data?.source ?? "oracle",
			status: res.data?.status ?? null,
			sequence: res.data?.sequence ?? null,
			updatedAt: res.data?.updatedAt ?? null,
			pdc: usd,
		},
	};
}

/** Historical MEXC klines are disabled — PDC prices come only from the oracle book. */
export async function syncHistoricalPrice() {
	return console.log("[pdc price] Historical MEXC backfill disabled; oracle spot only");
}

export async function syncLatestPrice() {
	try {
		const lastRow = await PdcPrice.findOne({
			attributes: ["timestamp"],
			order: [["timestamp", "DESC"]],
			raw: true,
		});

		if (lastRow?.timestamp && parseInt(lastRow.timestamp, 10) > (+new Date() - FOUR_HOURS_MS)) {
			return console.log(
				`[pdc price] Nothing to sync since ${new Date(parseInt(lastRow.timestamp, 10)).toUTCString()} (UTC)`
			);
		}

		const latestPrice = await fetchOraclePdcSpot();
		if (!latestPrice) {
			return console.log("[pdc price] Unable to fetch latest PDC price from oracle");
		}

		await PdcPrice.create({
			timestamp: String(latestPrice.timestamp),
			price: latestPrice.price,
			src: "oracle",
			raw: latestPrice.raw,
		});
		console.log(`[pdc price] Stored oracle PDC $${latestPrice.price}`);
	} catch (error) {
		console.log("[pdc price] latest sync failed", error);
	}
}

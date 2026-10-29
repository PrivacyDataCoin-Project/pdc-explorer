import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    assertPostgresIdent,
    blocksLimit,
    burnedPdcFromAtomic,
    escapeLike,
    formatTotalCoinsDisplay,
    isPosType,
    isPowType,
    oraclePricesUsdUrl,
    readOracleBookPrice,
    readTotalCoinsAtomic,
    transactionPathForKeyimage,
    txIdFromKeyimageLookup,
    utcDayStartSeconds,
} from "./pure.ts";

const HUGE = "15285792000000001";

describe("total coins", () => {
    it("reads an unquoted integer from raw daemon JSON without using Number()", () => {
        const body = `{"result":{"height":10,"total_coins":${HUGE}}}`;
        assert.equal(readTotalCoinsAtomic(body), HUGE);
        assert.notEqual(String(Number(HUGE)), HUGE);
    });

    it("reads a quoted total_coins string", () => {
        assert.equal(readTotalCoinsAtomic(`{"total_coins":"${HUGE}"}`), HUGE);
    });

    it("formats atomic units past MAX_SAFE_INTEGER to two decimal PDC", () => {
        assert.equal(formatTotalCoinsDisplay(HUGE), "15285.79");
        assert.equal(formatTotalCoinsDisplay("1000000000000"), "1.00");
        assert.equal(formatTotalCoinsDisplay("nope"), null);
    });
});

describe("oracle book price", () => {
    it("reads positive PDC/ETH quotes from the Trade prices map", () => {
        const book = { PDC: 0.98, ETH: 2300, BTCX: 80000 };
        assert.equal(readOracleBookPrice(book, "PDC"), 0.98);
        assert.equal(readOracleBookPrice(book, "eth"), 2300);
        assert.equal(readOracleBookPrice(book, "NOPE"), undefined);
        assert.equal(readOracleBookPrice(book, "PDC"), readOracleBookPrice({ PDC: "0.98" }, "PDC"));
        assert.equal(readOracleBookPrice({ PDC: 0 }, "PDC"), undefined);
    });

    it("builds the Trade prices/usd URL and falls back when TRADE_API_URL is empty", () => {
        assert.equal(
            oraclePricesUsdUrl("https://api.trade.privacydatacoin.com/api/"),
            "https://api.trade.privacydatacoin.com/api/prices/usd",
        );
        assert.equal(
            oraclePricesUsdUrl(""),
            "https://api.trade.privacydatacoin.com/api/prices/usd",
        );
    });
});

describe("chart day boundary", () => {
    it("floors unix seconds to the UTC day instead of treating them as milliseconds", () => {
        const sevenDaysBefore = 1_700_000_000;
        assert.equal(utcDayStartSeconds(sevenDaysBefore), sevenDaysBefore - (sevenDaysBefore % 86400));
        assert.equal(utcDayStartSeconds(0), 0);
        assert.equal(utcDayStartSeconds(Number.NaN), 0);
    });
});

describe("block type", () => {
    it("accepts both text and integer consensus types", () => {
        assert.equal(isPosType("0"), true);
        assert.equal(isPosType(0), true);
        assert.equal(isPowType("1"), true);
        assert.equal(isPowType(1), true);
        assert.equal(isPowType(0), false);
        assert.equal(isPosType(1), false);
    });
});

describe("recent outs limit", () => {
    it("defaults and caps the daemon blocks_limit", () => {
        assert.equal(blocksLimit(undefined), 5);
        assert.equal(blocksLimit("2"), 2);
        assert.equal(blocksLimit("100000"), 100);
        assert.equal(blocksLimit(0), 1);
        assert.equal(blocksLimit("nope"), 5);
    });
});

describe("like escape", () => {
    it("escapes wildcard characters", () => {
        assert.equal(escapeLike("100%_a\\b"), "100\\%\\_a\\\\b");
    });
});

describe("key image lookup", () => {
    it("rejects a numeric row id and accepts a transaction hash", () => {
        assert.equal(txIdFromKeyimageLookup(42), null);
        assert.equal(txIdFromKeyimageLookup("15"), null);
        const hash = "ab".repeat(32);
        assert.equal(txIdFromKeyimageLookup(hash.toUpperCase()), hash);
        assert.equal(transactionPathForKeyimage(hash), `/transaction/${hash}`);
        assert.equal(transactionPathForKeyimage(7), null);
    });
});

describe("burned supply", () => {
    it("divides an exact atomic sum", () => {
        assert.equal(burnedPdcFromAtomic("2500000000000"), 2.5);
        assert.equal(burnedPdcFromAtomic("nope"), 0);
    });
});

describe("postgres identifier", () => {
    it("accepts a plain name and rejects quotes", () => {
        assert.equal(assertPostgresIdent("pdc_explorer", "PGDATABASE"), "pdc_explorer");
        assert.throws(() => assertPostgresIdent('pdc"; drop', "PGDATABASE"));
        assert.throws(() => assertPostgresIdent("", "PGDATABASE"));
    });
});

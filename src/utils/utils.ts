import TransactionInfo from "@/interfaces/common/TransactionInfo";
import ChartSeriesElem from "../interfaces/common/ChartSeriesElem";
import Block from "../interfaces/state/Block";
import { chartDataFieldMap, chartRequestNames } from "./constants";
import Fetch from "./methods";

class Utils {
    static shortenAddress(address: string): string {
        if (address.length < 10) return address;
        return address.slice(0, 6) + "..." + address.slice(-4);
    }
    static formatTimestampUTC(timestamp: number) {
        const date = new Date(timestamp * 1e3);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    static formatNumber(number: number | string | undefined, decimalPlaces: number = 2): string {
        if (number === undefined) return "";
        const parsedNumber = typeof number === "number" ? number : parseFloat(number) || 0;
        const roundedNumber = parsedNumber.toFixed(decimalPlaces);
        const [integerPart, decimalPart] = roundedNumber.split(".");
        const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        const formattedNumber = formattedIntegerPart + (decimalPlaces > 0 ? "." + decimalPart : "");
        return formattedNumber;
    }

    static replaceUndefinedWithNull(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(Utils.replaceUndefinedWithNull); 
        } else if (typeof obj === 'object' && obj !== null) {
            return Object.fromEntries(
                Object.entries(obj).map(([key, value]) => [
                    key,
                    value === undefined ? null : Utils.replaceUndefinedWithNull(value),
                ])
            );
        }
        return obj;
    }


    static toShiftedNumber(number: number | string | undefined, shift: number = 2, decimalPlaces: number = 2) {
        if (typeof number !== "string" && typeof number !== "number") return "";
        const string = typeof number === "string" ? number : number.toString();
        const input = string.replace(/\D/g, "");
        const length = input.length;

        if (shift > length) {
            return "0." + ("0".repeat(shift - length) + input).slice(0, 2);
        }

        const delimitedCharIndex = Math.max(0, length - shift);
        const integerPart = input.slice(0, delimitedCharIndex) || '0';
        const decimalPart = decimalPlaces ? input.slice(delimitedCharIndex, length) + "0".repeat(decimalPlaces) : "";

        return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (decimalPart ? "." + decimalPart.slice(0, decimalPlaces) : "");
    }

    static convertENotationToString(num: number | string): string {
        const str = num.toString()
        const match = str.match(/^(\d+)(\.(\d+))?[eE]([-\+]?\d+)$/)
        if (!match) return str;
        const [, integer, , tail, exponentStr] = match
        const exponent = Number(exponentStr)
        const realInteger = integer + (tail || '')
        if (exponent > 0) {
            const realExponent = Math.abs(exponent + integer.length)
            return realInteger.padEnd(realExponent, '0')
        } else {
            const realExponent = Math.abs(exponent - (tail?.length || 0))
            return '0.' + realInteger.padStart(realExponent, '0')
        }
    }

    static transformToBlocks(result: any, reverse: boolean = false, hashField: boolean = false): Block[] {
        if (result.sucess === false) return [];
        if (!(result instanceof Array)) return [];

        return (reverse ? result.reverse() : result).map((e: any) => ({
            height: e.height,
            type: e.type === '0' ? "PoS" : "PoW",
            timestamp: +new Date(parseInt(e.timestamp, 10)),
            size: e.total_txs_size,
            transactions: e.tr_count,
            hash: !hashField ? e.tx_id : e.hash
        } as Block));
    }

    static timeElapsedString(timestamp: number, includeSeconds: boolean = false): string {
        const currentTimestamp: number = Date.now() / 1000;
        const elapsedSeconds: number = currentTimestamp - timestamp;

        if (elapsedSeconds < 60) {

            if (includeSeconds && elapsedSeconds > 1) {
                const seconds: number = Math.floor(elapsedSeconds);
                return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
            } else {
                return "just now";
            }
        } else if (elapsedSeconds < 3600) {
            const minutes: number = Math.floor(elapsedSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (elapsedSeconds < 86400) {
            const hours: number = Math.floor(elapsedSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (elapsedSeconds < 31536000) {
            const days: number = Math.floor(elapsedSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            const years: number = Math.floor(elapsedSeconds / 31536000);
            return `${years} year${years > 1 ? 's' : ''} ago`;
        }
    }

    static async fetchChartInfo(chartId: string, offset: number): Promise<ChartSeriesElem[][] | undefined> {
        if (!(chartId && chartRequestNames[chartId])) return;
        const result = await Fetch.getChartData(chartId, offset);
        if (!result) return;
        if (result.success === false) return;

        if (chartId === "difficulty-pow" || chartId === "difficulty-pos") {
            const dataDetailed = result.detailed;
            
            if (!dataDetailed || typeof dataDetailed !== "object") return;

            return [
                dataDetailed.map(
                    (e: any) => ({
                        x: parseFloat(e?.at || 0) * 1e3,
                        y: parseInt(e?.d, 10) || 0,
                        label: "test"
                    })
                )
            ];
        } else {
            if (!(result instanceof Array)) return;

            if (chartId === "hash-rate") {
                return [
                    result.map(
                        (e: any) => ({
                            x: parseFloat(e?.at || 0) * 1e3,
                            y: parseFloat(e?.h100) || 0,
                            label: "test"
                        })
                    ),
                    result.map(
                        (e: any) => ({
                            x: parseFloat(e?.at || 0) * 1e3,
                            y: parseFloat(e?.h400) || 0,
                            label: "test"
                        })
                    ),
                    result.map(
                        (e: any) => ({
                            x: parseFloat(e?.at || 0) * 1e3,
                            y: parseFloat(e?.d120) || 0,
                            label: "test"
                        })
                    )
                ];
            } else {
                return [
                    result.map(
                        (e: any) => ({
                            x: parseFloat(e?.at || 0) * 1e3,
                            y: e?.[chartDataFieldMap[chartId]] || 0,
                            label: "test"
                        })
                    )
                ];
            }
        }
    }

    static async getPdcPrice(): Promise<number | undefined> {
        const result = await Fetch.getPrice();
        const price = result?.data?.pdc?.usd;
        return price;
    }

    static async fetchTransaction(hash: string) {
        if (!hash) return null;
        const result = await Fetch.getTransaction(hash);
        if (result.success === false) return null;
        if (!(typeof result === "object")) return null;

        const newTransactionInfo: TransactionInfo = {
            hash: result.tx_id || "",
            amount: Utils.toShiftedNumber(result.amount || "0", 12),
            fee: Utils.toShiftedNumber(result.fee || "0", 12),
            size: result.blob_size || "0",
            confirmations: parseInt(result.keeper_block, 10) > 0 ? parseInt(result.last_block, 10) - parseInt(result.keeper_block, 10) : 0,
            publicKey: result.pub_key || "-",
            mixin: "-",
            extraItems: [],
            ins: [],
            outs: [],
            attachments: undefined
        }

        const blockOrigin = {
            hash: result.block_hash || "",
            height: Utils.formatNumber(result.keeper_block || "0", 0),
            timestamp: result.timestamp || ""
        };

        try {
            const parsedExtraItems = JSON.parse(result.extra);
            if (parsedExtraItems instanceof Array) {
                newTransactionInfo.extraItems = parsedExtraItems.map(e => {
                    return `(${e.type || ""}) ${e.short_view || ""}`;
                });
            }
        } catch { }

        try {
            const parsedIns = JSON.parse(result.ins);
            if (parsedIns instanceof Array) {
                newTransactionInfo.ins = parsedIns.map(e => {
                    const mixins = (e?.mixins instanceof Array) ? e?.mixins : [];
                    const globalIndexes = (e?.global_indexes instanceof Array) ? e?.global_indexes : [];

                    const existingAmount = ((e?.amount || 0) / 1e12);
                    if (existingAmount) {
                        e.convertedAmount = Utils.convertENotationToString(existingAmount?.toExponential());
                    }

                    return {
                        amount: e.convertedAmount,
                        keyimage: e?.kimage_or_ms_id || "",
                        mixins: mixins,
                        globalIndexes: globalIndexes
                    }
                });
            }
        } catch { }

        try {
            const parsedOuts = JSON.parse(result.outs);
            if (parsedOuts instanceof Array) {
                newTransactionInfo.outs = parsedOuts.map(e => {
                    const { pub_keys } = e;
                    const pubKeys = (pub_keys instanceof Array) ? pub_keys : [];

                    const existingAmount = (e?.amount / 1e12);
                    if (existingAmount) {
                        e.convertedAmount = Utils.convertENotationToString(existingAmount?.toExponential());
                    }

                    return {
                        amount: e.convertedAmount || "0",
                        publicKeys: pubKeys.slice(0, 4),
                        globalIndex: e?.global_index || 0
                    }
                })
            }
        } catch { }

        return {
            transactionInfo: newTransactionInfo,
            blockOrigin: blockOrigin
        }
    }

    static async fetchBlock(hash: string, alt: boolean = false) {
        if (!hash) return null;
        const result = await Fetch.getBlockInfo(hash, alt);
        if (result.success === false) return null;

        const blockInfo = {
            type: result.type === "1" ? "PoW" : "PoS" as "PoW" | "PoS",
            timestamp: result.timestamp || undefined,
            actualTimestamp: result.actual_timestamp || undefined,
            difficulty: Utils.formatNumber(result.difficulty || "", 0),
            minerTextInfo: result.miner_text_info || undefined,
            cummulativeDiffAdjusted: Utils.formatNumber(result.cumulative_diff_adjusted || "", 0),
            cummulativeDiffPresize: Utils.formatNumber(result.cumulative_diff_precise || "", 0),
            orphan: result.is_orphan || false,
            baseReward: Utils.toShiftedNumber(result.base_reward || "0", 12),
            transactionsFee: Utils.toShiftedNumber(result.total_fee || "0", 12),
            rewardPenalty: "",
            reward: Utils.toShiftedNumber(result.summary_reward || "0", 12),
            totalBlockSize: result.block_tself_size || undefined,
            effectiveTxsMedian: undefined,
            blockFeeMedian: Utils.toShiftedNumber(result.this_block_fee_median || "0", 12),
            effectiveFeeMedian: Utils.toShiftedNumber(result.effective_fee_median || "0", 12),
            currentTxsMedian: undefined,
            transactions: result.tr_count || "0",
            transactionsSize: result.total_txs_size || "0",
            alreadyGeneratedCoins: result.already_generated_coins || undefined,
            object_in_json: result.object_in_json || undefined,
            tx_id: result.tx_id || undefined,
            prev_id: result.prev_id || undefined,
            minor_version: result?.object_in_json?.split('\"minor_version\": ')?.[1]?.split(',')?.[0] || '-',
            major_version: result?.object_in_json?.split('\"major_version\": ')?.[1]?.split(',')?.[0] || '-',
        };

        const rawTransactionsDetails = result.transactions_details;

        const transactionsDetails =
            typeof rawTransactionsDetails === "string"
                ? (() => {
                    try {
                        return JSON.parse(rawTransactionsDetails);
                    } catch { }
                })()
                : rawTransactionsDetails;

    
        return {
            height: result.height ?? null,
            transactionsDetails: (transactionsDetails instanceof Array) ? transactionsDetails.map(e => ({
                hash: e?.tx_id || "",
                fee: Utils.toShiftedNumber(e?.fee || "0", 12),
                amount: Utils.toShiftedNumber(e?.amount?.toString() || "0", 12),
                size: e?.blob_size || "0"
            })) : [],
            blockInfo: blockInfo
        };
    }
}

export default Utils;

export function classes(...classes: (string | boolean | undefined)[]): string {
    // boolean for constructions like [predicate] && [className]
    return classes.filter(className => className).join(" ");
}
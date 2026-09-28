import "dotenv/config";
import { NETWORK, PDC_ASSET_ID } from "../../src/config/network";

export { PDC_ASSET_ID };

const daemonBase = (process.env.API || `http://127.0.0.1:${NETWORK.rpcPort}`).replace(/\/$/, "");
const walletBase = process.env.AUDITABLE_WALLET_API
    ? process.env.AUDITABLE_WALLET_API.replace(/\/$/, "")
    : "";

export const config = {
    "api": daemonBase + "/json_rpc",
    "frontend_api": process.env.FRONTEND_API || `http://127.0.0.1:${process.env.SERVER_PORT || "3000"}`,
    "server_port": process.env.SERVER_PORT || "3000",
    "auditable_wallet": {
        "api": walletBase ? walletBase + "/json_rpc" : "",
    },
    "assets_whitelist_url": process.env.ASSETS_WHITELIST_URL || "",
    "websocket": {
        "enabled_during_sync": process.env.WEBSOCKET_ENABLED_DURING_SYNC === "true"
    },
    "enableVisibilityInfo": process.env.ENABLE_VISIBILITY_INFO === "true",
    "maxDaemonRequestCount": parseInt(process.env.MAX_DAEMON_REQUEST_COUNT || "", 10) || 1000,
    "trade_api_url": process.env.TRADE_API_URL || "",
    "matrix_api_url": process.env.MATRIX_API_URL || "",
    "mexc_api_url": (process.env.MEXC_API_URL || "https://api.mexc.com").replace(/\/$/, ""),
    "price_symbol": process.env.PRICE_SYMBOL || "",
}

export function nativeCoinAsset() {
    return {
        asset_id: PDC_ASSET_ID,
        logo: "/pdc-logo.png",
        price_url: "",
        ticker: NETWORK.ticker,
        full_name: NETWORK.name,
        total_max_supply: "0",
        current_supply: "0",
        decimal_point: NETWORK.decimalPoint,
        meta_info: "",
        price: 0,
    };
}

export function log(msg: string) {
    const now = new Date()

    console.log(
        now.getFullYear() +
        '-' +
        now.getMonth() +
        '-' +
        now.getDate() +
        ' ' +
        now.getHours() +
        ':' +
        now.getMinutes() +
        ':' +
        now.getSeconds() +
        '.' +
        now.getMilliseconds() +
        ' ' +
        msg
    )
}
export const parseComment = (comment) => {
    let splitComment = comment.split(/\s*,\s*/).filter((el) => !!el)
    let splitResult = splitComment[4]
    if (splitResult) {
        let result = splitResult.split(/\s*"\s*/)
        let input = result[3].toString()
        if (input) {
            let output = Buffer.from(input, 'hex')
            return output.toString()
        } else {
            return ''
        }
    } else {
        return ''
    }
}

export const parseTrackingKey = (trackingKey) => {
    let splitKey = trackingKey.split(/\s*,\s*/)
    let resultKey = splitKey[5]
    if (resultKey) {
        let key = resultKey.split(':')
        let keyValue = key[1].replace(/\[|\]/g, '')
        if (keyValue) {
            return keyValue.toString().replace(/\s+/g, '')
        } else {
            return ''
        }
    } else {
        return ''
    }
}

export const decodeString = (str) => {
    if (!!str) {
        str = str.replace(/'/g, "''")
        // eslint-disable-next-line no-control-regex
        return str.replace(/\u0000/g, '', (unicode) => {
            return String.fromCharCode(
                parseInt(unicode.replace(/\\u/g, ''), 16)
            )
        })
    }
    return str
}

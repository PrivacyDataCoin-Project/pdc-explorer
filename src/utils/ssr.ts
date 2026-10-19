import VisibilityInfo from "@/interfaces/state/VisibilityInfo";
import Fetch from "./methods";
import Block from "@/interfaces/state/Block";
import { PoolElement } from "@/components/default/TransactionPool/TransactionPool";
import Info from "@/interfaces/state/Info";
import { latestBlocksInitState } from "@/components/default/LatestBlocks/LatestBlocks";
import Utils from "./utils";
import { DEFAULT_ITEMS_ON_PAGE } from "@/pages/aliases";
import { DEFAULT_ASSETS_ON_PAGE } from "@/pages/assets";
import { BTCX_ASSET_ID, PDC_ASSET_ID } from "./constants";
import { GetServerSidePropsContext } from "next";

export async function getMainPageProps() {

    let visibilityInfo: VisibilityInfo | null = null;
    let info: Info | null = null;
    let latestBlocks: Block[] = [];
    let explorerStatus: "online" | "offline" | "syncing" = "offline";
    let daemonVersion: string | null = null;
    let txPoolElements: PoolElement[] = [];
    
    try {
        const response = await Fetch.getVisibilityInfo();

        if (response.success === false) {
            visibilityInfo = null;
        } else {
            visibilityInfo = response;
        }

    } catch {
        visibilityInfo = null;
    }

    try {
        const response = await Fetch.getInfo();

        if (response.success === false) {
            info = null;
        } else {
            info = response;
        }
    } catch {
        info = null;
    }


    try {
        const status = await Fetch.getExplorerStatus();


        explorerStatus = status?.data?.explorer_status || "offline";
        const rawVersion = status?.data?.daemon_version;
        daemonVersion = explorerStatus !== "offline" && typeof rawVersion === "string" && rawVersion.trim()
            ? rawVersion.trim()
            : null;

    } catch (error) {
        console.error("Error fetching explorer status:", error);
        explorerStatus = "offline";
        daemonVersion = null;
    }

    try {
        if (info) {
            const { height, database_height } = info;
            const { itemsInPage, page } = latestBlocksInitState;

            const heightToRequest = database_height > 0 ? Math.min(height, database_height) : height;

            const response = await Fetch.getBlockDetails(heightToRequest - itemsInPage * page, itemsInPage);

            if (response.success !== false && response instanceof Array) {
                latestBlocks = Utils.transformToBlocks(response, true);              
            }
        }
    } catch {
        latestBlocks = [];
    }

    try {
        const response = await Fetch.getTxPoolInfo(0);

        if (response.success === false) {
            txPoolElements = [];
        } else {
            txPoolElements = response;
        }
    } catch {
        txPoolElements = [];
    }

    return {
        props: {
            visibilityInfo,
            explorerStatus,
            daemonVersion,
            info,
            latestBlocks,
            txPoolElements,
        },
    };
}

export interface StatsPageProps {
    visibilityInfo: VisibilityInfo | null;
    isOnline: boolean;
    info: Info | null;
}

export async function getStats() {

    let visibilityInfo: VisibilityInfo | null = null;
    let info: Info | null = null;
    let isOnline: boolean = false;
    
    try {
        const response = await Fetch.getVisibilityInfo();

        if (response.success === false) {
            visibilityInfo = null;
        } else {
            visibilityInfo = response;
        }

    } catch {
        visibilityInfo = null;
    }

    try {
        const response = await Fetch.getInfo();

        if (response.success === false) {
            info = null;
            isOnline = false;
        } else {
            info = response;
            isOnline = response.status === "OK";
        }
    } catch {
        isOnline = false;
        info = null;
    }

    return {
        props: {
            visibilityInfo,
            isOnline,
            info
        },
    };
}

export interface TransactionPageProps extends StatsPageProps {
    transactionsData: Awaited<ReturnType<typeof Utils.fetchTransaction>>;
}

export async function getTransaction(context: GetServerSidePropsContext) {
    const stats = await getStats();


    const transactionData = await (async () => {
        const hash = context.params?.hashQuery as string | undefined;

        if (!hash) {
            return null;
        }
    
        const transactionInfo = await Utils.fetchTransaction(hash);

        return transactionInfo;
    })();


    return {
        props: {
            ...stats.props,
            transactionsData: Utils.replaceUndefinedWithNull(transactionData)
        },
    };
}


export interface BlockPageProps extends StatsPageProps {
    blockData: Awaited<ReturnType<typeof Utils.fetchBlock>>;
}


export async function getBlock(context: GetServerSidePropsContext) {
    const stats = await getStats();

    const blockData = await (async () => {
        const hash = context.params?.hash as string | undefined;

        if (!hash) {
            return null;
        }
    
        const blockInfo = await Utils.fetchBlock(hash);

        return blockInfo;
    })();


    return {
        props: {
            ...stats.props,
            blockData: Utils.replaceUndefinedWithNull(blockData)
        },
    };
}

export interface AliasesPageProps {
    aliasesAmount?: number;
    premiumAliasesAmount?: number;
    aliases: { alias: string, address: string, hasMatrixConnection: boolean }[];
}

export async function getAliases() {
    try {
        const countRes = await Fetch.getAliasesCount();
        const aliasesAmount = countRes?.aliasesAmount as number;
        const premiumAliasesAmount = countRes?.premiumAliasesAmount as number;

        const itemsAmount = parseInt(DEFAULT_ITEMS_ON_PAGE, 10) || 0;
        const aliasesResp = await Fetch.getAliases(0, itemsAmount, false);

        return {
            props: {
                aliasesAmount,
                premiumAliasesAmount,
                aliases: (aliasesResp || []).map((e: any) => ({
                    alias: e.alias || "" as string,
                    address: e.address || "" as string,
                    hasMatrixConnection: e.hasMatrixConnection || false as boolean
                }))
            },
        };
    } catch {
        return {
            props: {
                aliasesAmount: 0,
                premiumAliasesAmount: 0,
                aliases: [],
            },
        };
    }
}

export interface AssetsPageProps {
    assetsAmount?: number;
    whitelistedAssetsAmount?: number;
    assets: any[];
}

export async function getAssets() {
    try {
        const result = await Fetch.getAssetsCount();
        const assetsAmount = result?.assetsAmount;
        const whitelistedAssetsAmount = result?.whitelistedAssetsAmount;

        const assets = await Fetch.getWhitelistedAssets(0, parseInt(DEFAULT_ASSETS_ON_PAGE, 10), "")

        let pdcUsd: number | undefined;
        let btcxUsd: number | undefined;
        try {
            const market = await Fetch.getPdcMarket();
            pdcUsd = Number(market?.data?.pdcUsd ?? market?.data?.usd);
            btcxUsd = Number(market?.data?.btcxUsd);
            const pdcInBtcx = Number(market?.data?.btcx);
            if (!(Number.isFinite(btcxUsd) && btcxUsd > 0)
                && Number.isFinite(pdcUsd) && (pdcUsd as number) > 0
                && Number.isFinite(pdcInBtcx) && pdcInBtcx > 0) {
                btcxUsd = (pdcUsd as number) / pdcInBtcx;
            }
        } catch {
            pdcUsd = await Utils.getPdcPrice();
        }

        assets.forEach((element: any) => {
            if (element.asset_id === PDC_ASSET_ID && Number.isFinite(pdcUsd) && (pdcUsd as number) > 0) {
                element.price = (pdcUsd as number).toFixed(2);
            }
            if (element.asset_id === BTCX_ASSET_ID && Number.isFinite(btcxUsd) && (btcxUsd as number) > 0) {
                element.price = (btcxUsd as number).toFixed(2);
            }
        });

        return {
            props: {
                assetsAmount,
                whitelistedAssetsAmount,
                assets: assets || []
            },
        };
    } catch {
        return {
            props: {
                assetsAmount: 0,
                whitelistedAssetsAmount: 0,
                assets: [],
            },
        };
    }
}
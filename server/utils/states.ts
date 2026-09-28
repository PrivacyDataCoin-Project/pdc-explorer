
interface IBlockInfo {
    lastBlock?: number,
    daemon_network_state?: number,
    height?: number,
    tx_pool_size?: number,
    alias_count?: number,
    alt_blocks_count?: number,
}
export let blockInfo: IBlockInfo = {};
export function setBlockInfo(newBlockInfo: IBlockInfo) {
    blockInfo = newBlockInfo;
}


export interface ILastBlock {
    height: number,
    tx_id: string
}
export let lastBlock: ILastBlock = {
    height: -1,
    tx_id: '0000000000000000000000000000000000000000000000000000000000000000'
}

export interface PriceData {
    price?: number;
    usd_24h_change?: number;
    lastUpdated?: string;
}


export interface State {
    countAliasesDB?: number;
    countAltBlocksDB?: number;
    countAliasesServer?: number;
    countAltBlocksServer?: number;
    countTrPoolServer?: number;
    statusSyncPool: boolean;
    now_delete_offers: boolean;
    statusSyncAltBlocks: boolean;
    now_blocks_sync: boolean;
    serverTimeout: number;
    block_array: any[];
    pools_array: any[];
    priceData: {
        [key: string]: PriceData
    };
    fiat_rates: {
        [key: string]: number
    }
    pdcBurned?: number;
    explorer_status: "online" | "offline" | "syncing";
}

export let state: State = {
    statusSyncPool: false,
    now_delete_offers: false,
    statusSyncAltBlocks: false,
    now_blocks_sync: false,
    serverTimeout: 30,
    block_array: [],
    pools_array: [],
    priceData: {},
    fiat_rates: {},
    explorer_status: "offline",
}

export function setState(newState: State) { 
    state = newState;
}

export function setLastBlock(lastBlock_: ILastBlock) {
    lastBlock = lastBlock_;
}
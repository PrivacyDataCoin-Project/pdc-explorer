import axios from 'axios';
import { config } from './utils';

export async function get_info() {
    return await axios({
        method: 'get',
        url: config.api,
        data: {
            method: 'getinfo',
            params: { flags: 0x410 }
        },
        transformResponse: [(data) => JSON.parse(data)]
    });
}

export function get_blocks_details(start, count) {
    return axios({
        method: 'get',
        url: config.api,
        data: {
            method: 'get_blocks_details',
            params: {
                height_start: parseInt(start ? start : 0),
                count: parseInt(count ? count : 10),
                ignore_transactions: false
            }
        },
        transformResponse: [(data) => JSON.parse(data)]
    });
}

export function get_alt_blocks_details(offset, count) {
    return axios({
        method: 'get',
        url: config.api,
        data: {
            method: 'get_alt_blocks_details',
            params: {
                offset: parseInt(offset),
                count: parseInt(count)
            }
        },
        transformResponse: [(data) => JSON.parse(data)]
    });
}

export function get_all_pool_tx_list() {
    return axios({
        method: 'get',
        url: config.api,
        data: {
            method: 'get_all_pool_tx_list'
        },
        transformResponse: [(data) => JSON.parse(data)]
    });
}

export function get_pool_txs_details(ids) {
    return axios({
        method: 'get',
        url: config.api,
        data: {
            method: 'get_pool_txs_details',
            params: { ids: ids }
        },
        transformResponse: [(data) => JSON.parse(data)]
    });
}

export function get_tx_details(tx_hash) {
    return axios({
        method: 'get',
        url: config.api,
        data: {
            method: 'get_tx_details',
            params: { tx_hash: tx_hash }
        },
        transformResponse: [(data) => JSON.parse(data)]
    });
}

export function get_out_info(amount, i) {
    return axios({
        method: 'get',
        url: config.api,
        data: {
            method: 'get_out_info',
            params: { amount: parseInt(amount), i: parseInt(i) }
        },
        transformResponse: [(data) => JSON.parse(data)]
    });
}

export function getbalance() {
    return axios({
        method: 'post',
        url: config.auditable_wallet.api,
        data: {
            method: 'getbalance',
            params: {}
        },
        transformResponse: [(data) => JSON.parse(data)]
    });
}

export function get_mining_history(howManyDays = 7) {
    let now = new Date();
    let date = now.getDate() - howManyDays;
    let timestamp = Math.round(now.setDate(date) / 1000);

    console.log('Mining history timestamp:', timestamp);
    

    return axios({
        method: 'post',
        url: config.auditable_wallet.api,
        data: {
            method: 'get_mining_history',
            params: { v: timestamp }
        },
        transformResponse: [(data) => JSON.parse(data)]
    });
}

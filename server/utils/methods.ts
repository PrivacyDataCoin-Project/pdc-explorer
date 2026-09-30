import { literal, Op } from "sequelize";
import Block from "../schemes/Block";
import axios from "axios";
import { config, log } from "./utils";
import { get_info, get_mining_history, getbalance } from "./pdcd";
import BigNumber from "bignumber.js";
import Transaction from "../schemes/Transaction";
import Pool from "../schemes/Pool";
import { io } from "../server";
import { blockInfo, lastBlock, state } from "./states";
import { Socket } from "socket.io";

interface getBlocksDetailsParams {
    start: number;
    count: number;
}

export async function getBlocksDetails(params: getBlocksDetailsParams) {
    const { start, count } = params;

    const result = await Block.findAll({
        attributes: [
            'height',
            [literal(`CASE WHEN type = '0' THEN actual_timestamp ELSE timestamp END`), 'timestamp'],
            'base_reward',
            'blob',
            'block_cumulative_size',
            'block_tself_size',
            'cumulative_diff_adjusted',
            'cumulative_diff_precise',
            'difficulty',
            'effective_fee_median',
            'tx_id',
            'is_orphan',
            'penalty',
            'prev_id',
            'summary_reward',
            'this_block_fee_median',
            'actual_timestamp',
            'total_fee',
            'total_txs_size',
            'tr_count',
            'type',
            'miner_text_info',
            'already_generated_coins',
            'object_in_json',
            'pow_seed'
        ],
        where: {
            height: {
                [Op.gte]: start
            }
        },
        order: [['height', 'ASC']],
        limit: count
    });

    return result.length > 0 ? result.map(e => e.toJSON()) : [];
}

export async function getVisibilityInfo() {
    const result = {
        amount: 0,
        percentage: 0,
        balance: 0,
        unlocked_balance: 0,
        apy: 0,
        pdc_burned: state.pdcBurned ?? 0,
        pos_value: 0,
    }

    try {
        const dayAgo = Math.floor(Date.now() / 1000) - 86400;
        result.pos_value = await Block.count({
            where: {
                type: "0",
                actual_timestamp: {
                    [Op.gt]: dayAgo
                }
            }
        });

        const info = await get_info();
        const daemon = info.data?.result;
        if (daemon?.pos_difficulty && daemon?.total_coins && daemon.total_coins !== "0") {
            const posDiff = new BigNumber(daemon.pos_difficulty);
            const totalCoins = new BigNumber(daemon.total_coins);
            const divider = new BigNumber(176.3630);
            const stakedPercentage = new BigNumber(0.55)
                .multipliedBy(posDiff.dividedBy(totalCoins))
                .dividedBy(divider)
                .multipliedBy(100);
            result.percentage = parseFloat(stakedPercentage.toFixed(4));
            result.amount = totalCoins.dividedBy(100).multipliedBy(stakedPercentage).integerValue(BigNumber.ROUND_HALF_UP).toNumber();
        }

        if (config.enableVisibilityInfo && config.auditable_wallet?.api) {
            const [res1, res2] = await axios.all([
                getbalance(),
                get_mining_history()
            ]);

            result.balance = res1.data.result.balance;
            result.unlocked_balance = res1.data.result.unlocked_balance;

            const stakedNumber = new BigNumber(result.amount).dividedBy(new BigNumber(10 ** 12)).toNumber();
            if (stakedNumber > 0) {
                result.apy = 1440 * 365 / stakedNumber * 100;
            }
        }
    } catch (error) {
        log(`getVisibilityInfo() ERROR ${error}`)
    }
    return JSON.stringify(result)
}

export async function getMainBlockDetails(id: string) {
    const block = await Block.findOne({
        where: { tx_id: id }
    });

    if (block) {

        const nextBlock = await Block.findOne({
            where: {
                height: {
                    [Op.gt]: block.height
                }
            },
            order: [['height', 'ASC']]
        });

        if (nextBlock) {
            block.setDataValue('nextBlock', nextBlock.tx_id);
        }

        const transactions = await Transaction.findAll({
            where: { keeper_block: block.height }
        });

        block.setDataValue('transactions_details', transactions.map(e => e.toJSON()));

        return block.toJSON();
    }
}

export async function getTxPoolDetails(count: number) {
    // When count is 0, retrieve all records ordered by timestamp DESC
    if (count === 0) {
        const result = await Pool.findAll({
            attributes: ['blob_size', 'fee', 'id', 'timestamp', 'tx_id'],
            order: [['timestamp', 'DESC']]
        });
        return result.length > 0 ? result : [];
    }

    // Retrieve records with a limit, ordered by timestamp DESC
    const result = await Pool.findAll({
        attributes: [
            'blob_size',
            'fee',
            'id',
            'timestamp',
            'tx_id',
            [literal('false'), 'isNew'] // Adding a literal false as "isNew"
        ],
        order: [['timestamp', 'DESC']],
        limit: count || 500
    });

    return result.length > 0 ? result : [];
}

export const emitSocketInfo = async (socket?: Socket) => {
    if (config.websocket.enabled_during_sync && lastBlock) {
        blockInfo.lastBlock = lastBlock.height

        const emitter = socket || io;

        emitter.emit('get_info', JSON.stringify(blockInfo));
        emitter.emit('get_visibility_info', getVisibilityInfo());
    }
}
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
        pdc_burned: undefined as (number | undefined),
        pos_value: 0,
    }

    try {
        if (config.enableVisibilityInfo) {
            const [res1, res2, res3] = await axios.all([
                getbalance(),
                get_mining_history(),
                get_info()
            ])

            console.log('RES1', res1.data);

            const pos_diff_to_total_ratio = new BigNumber(res3.data.result.pos_difficulty)
                .dividedBy(new BigNumber(res3.data.result.total_coins));

            const divider = new BigNumber(176.3630);

            const stakedPercentage = (
                new BigNumber(0.55).multipliedBy(pos_diff_to_total_ratio)
            ).dividedBy(divider).multipliedBy(100).toNumber();


            result.percentage = parseFloat(stakedPercentage.toFixed(2));

            const stakedCoins = new BigNumber(res3.data.result.total_coins)
                .dividedBy(100)
                .multipliedBy(new BigNumber(result.percentage));

            result.amount = stakedCoins.toNumber();
            result.balance = res1.data.result.balance
            result.unlocked_balance = res1.data.result.unlocked_balance;
            result.pdc_burned = state.pdcBurned;

            const stakedNumber = new BigNumber(result.amount).dividedBy(new BigNumber(10 ** 12)).toNumber();

            // PDC block target is 60s, so CURRENCY_BLOCKS_PER_DAY is 1440.
            result.apy = 1440 * 365 / stakedNumber * 100;

            let stakedCoinsLast7Days = new BigNumber(0);
    
            const mined_entries = res2?.data?.result?.mined_entries || [];
        
            for (const item of mined_entries) {
                stakedCoinsLast7Days = stakedCoinsLast7Days.plus(item.a);
            }


            const coinsPerDay = stakedCoinsLast7Days.div(7);
   
            const neededToStakeCoinPerDay = new BigNumber(res1.data.result.balance).div(coinsPerDay);
            
            result.pos_value = neededToStakeCoinPerDay.toNumber();
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
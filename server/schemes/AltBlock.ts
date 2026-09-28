import { Model, DataTypes } from "sequelize";
import sequelize from "../database/sequelize";

class AltBlock extends Model {
    declare readonly id: number;
    declare height: number;
    declare timestamp: BigInt;
    declare actual_timestamp: BigInt;
    declare size: BigInt;
    declare hash: string;
    declare type: number;
    declare difficulty: string;
    declare cumulative_diff_adjusted: string;
    declare is_orphan: boolean;
    declare base_reward: string;
    declare total_fee: string;
    declare penalty: BigInt;
    declare summary_reward: BigInt;
    declare block_cumulative_size:  string;
    declare this_block_fee_median: string;
    declare effective_fee_median: string;
    declare total_txs_size: string;
    declare transaction_details: string;
    declare miner_txt_info: string;
    declare pow_seed: string;

    
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

AltBlock.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        height: { type: DataTypes.INTEGER, allowNull: false },
        timestamp: { type: DataTypes.BIGINT, allowNull: false },
        actual_timestamp: { type: DataTypes.BIGINT, allowNull: true },
        size: { type: DataTypes.BIGINT, allowNull: true },
        hash: { type: DataTypes.STRING, allowNull: true },
        type: { type: DataTypes.INTEGER, allowNull: true },
        difficulty: { type: DataTypes.TEXT, allowNull: true },
        cumulative_diff_adjusted: { type: DataTypes.TEXT, allowNull: true },
        is_orphan: { type: DataTypes.BOOLEAN, allowNull: true },
        base_reward: { type: DataTypes.TEXT, allowNull: true },
        total_fee: { type: DataTypes.TEXT, allowNull: true },
        penalty: { type: DataTypes.BIGINT, allowNull: true },
        summary_reward: { type: DataTypes.BIGINT, allowNull: true },
        block_cumulative_size: { type: DataTypes.TEXT, allowNull: true },
        this_block_fee_median: { type: DataTypes.TEXT, allowNull: true },
        effective_fee_median: { type: DataTypes.TEXT, allowNull: true },
        total_txs_size: { type: DataTypes.TEXT, allowNull: true },
        transaction_details: { type: DataTypes.STRING, allowNull: true },
        miner_txt_info: { type: DataTypes.STRING, allowNull: true },
        pow_seed: { type: DataTypes.STRING, allowNull: true }
    },
    {
        sequelize,
        modelName: "alt_blocks",
        timestamps: true
    }
);

export default AltBlock;

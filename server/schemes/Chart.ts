import { Model, DataTypes } from "sequelize";
import sequelize from "../database/sequelize";

class Chart extends Model {
    declare readonly id: number;
    declare height: number;
    declare actual_timestamp: BigInt;
    declare block_cumulative_size: string;
    declare cumulative_diff_precise: string;
    declare difficulty: string;
    declare tr_count: BigInt;
    declare type: string;
    declare difficulty120?: string;
    declare hashrate100?: string;
    declare hashrate400?: string;
    
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

export type IChart = Omit<Chart, keyof Model | 'createdAt' | 'updatedAt' | 'id'>;

Chart.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

        height: { type: DataTypes.INTEGER, allowNull: false },
        actual_timestamp: { type: DataTypes.BIGINT, allowNull: true },
        block_cumulative_size: { type: DataTypes.TEXT, allowNull: true },
        cumulative_diff_precise: { type: DataTypes.TEXT, allowNull: true },
        difficulty: { type: DataTypes.TEXT, allowNull: true },
        tr_count: { type: DataTypes.TEXT, allowNull: true },
        type: { type: DataTypes.TEXT, allowNull: true },
        difficulty120: { type: DataTypes.TEXT, allowNull: true },
        hashrate100: { type: DataTypes.TEXT, allowNull: true },
        hashrate400: { type: DataTypes.TEXT, allowNull: true }
    },
    {
        sequelize,
        modelName: "charts",
        timestamps: true
    }
);

export default Chart;

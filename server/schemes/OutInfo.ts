import { Model, DataTypes } from "sequelize";
import sequelize from "../database/sequelize";

class OutInfo extends Model {
    declare readonly id: number;
    declare amount: string;
    declare i: BigInt;
    declare tx_id: string;
    declare block: BigInt;
    
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

export type IOutInfo = Omit<OutInfo, keyof Model | 'createdAt' | 'updatedAt' | 'id'>;

OutInfo.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        amount: { type: DataTypes.TEXT, allowNull: true },
        i: { type: DataTypes.BIGINT, allowNull: true },
        tx_id: { type: DataTypes.STRING, allowNull: true },
        block: { type: DataTypes.BIGINT, allowNull: true }
    },
    {
        sequelize,
        modelName: "out_info",
        timestamps: true
    }
);

export default OutInfo;

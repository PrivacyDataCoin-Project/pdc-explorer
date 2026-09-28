import { Model, DataTypes } from "sequelize";
import sequelize from "../database/sequelize";
import Block from "./Block";

class Transaction extends Model {
    declare readonly id: number;
    declare keeper_block: number;
    declare tx_id: string;
    declare amount: string;
    declare blob_size: string;
    declare extra: string;
    declare fee: string;
    declare ins: string;
    declare outs: string;
    declare pub_key: string;
    declare timestamp: BigInt;
    declare attachments: string;

    
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

export type ITransaction = Omit<Transaction, keyof Model | 'createdAt' | 'updatedAt' | 'id'>;

Transaction.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

        keeper_block: { type: DataTypes.INTEGER, allowNull: true },
        tx_id: { type: DataTypes.STRING, allowNull: true },
        amount: { type: DataTypes.STRING, allowNull: true },
        blob_size: { type: DataTypes.STRING, allowNull: true },
        extra: { type: DataTypes.TEXT, allowNull: true },
        fee: { type: DataTypes.STRING, allowNull: true },
        ins: { type: DataTypes.TEXT, allowNull: true },
        outs: { type: DataTypes.TEXT, allowNull: true },
        pub_key: { type: DataTypes.TEXT, allowNull: true },
        timestamp: { type: DataTypes.BIGINT, allowNull: true },
        attachments: { type: DataTypes.TEXT, allowNull: true }
    },
    {
        sequelize,
        modelName: "transactions",
        timestamps: true,
        indexes: [
            {
                fields: ['keeper_block'],
            },
        ],
    }
);

Transaction.belongsTo(Block, {
    foreignKey: "keeper_block",
    targetKey: "height",
    as: "block"
});

export default Transaction;

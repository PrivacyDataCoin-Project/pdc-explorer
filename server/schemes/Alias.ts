import { Model, DataTypes } from "sequelize";
import sequelize from "../database/sequelize";

class Alias extends Model {
    declare readonly id: number;
    declare alias: string;
    declare address: string;
    declare comment: string;
    declare tracking_key: string;
    declare block: string
    declare transaction: string;
    declare enabled: boolean;
    
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

Alias.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        alias: { type: DataTypes.STRING, allowNull: false, unique: true },
        address: { type: DataTypes.STRING, allowNull: false },
        comment: { type: DataTypes.STRING, allowNull: true },
        tracking_key: { type: DataTypes.STRING, allowNull: true },
        block: { type: DataTypes.STRING, allowNull: true },
        transaction: { type: DataTypes.STRING, allowNull: true },
        enabled: { type: DataTypes.BOOLEAN, allowNull: true }
    },
    {
        sequelize,
        modelName: "aliases",
        timestamps: true
    }
);

export default Alias;

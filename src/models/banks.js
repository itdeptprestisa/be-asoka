const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Banks = sequelize.define(
  "Banks",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    hook_account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "banks",
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    timestamps: true, // handles created_at and updated_at
    paranoid: true, // handles deleted_at
    underscored: true, // snake_case columns
  }
);

module.exports = Banks;

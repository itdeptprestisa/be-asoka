const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Settings = sequelize.define(
  "Settings",
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
    meta_value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    meta_key: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    transfer_fee: {
      type: DataTypes.DOUBLE(15, 2),
      allowNull: false,
    },
    additional_price: {
      type: DataTypes.DOUBLE(15, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "settings",
    createdAt: "created_at",
    updatedAt: "updated_at",
    timestamps: true, // handles created_at and updated_at
    underscored: true, // snake_case columns
  }
);

module.exports = Settings;

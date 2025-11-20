const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CustomerBanks = sequelize.define(
  "CustomerBanks",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    account_number: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    account_holder: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    bank_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    bank_verified: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    customer_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
  },
  {
    tableName: "customer_banks",
    timestamps: true,
    paranoid: true, // enables soft deletes (deleted_at)
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  }
);

module.exports = CustomerBanks;

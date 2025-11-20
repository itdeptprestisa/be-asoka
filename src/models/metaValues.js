const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MetaValues = sequelize.define(
  "MetaValues",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    online_price: {
      type: DataTypes.DOUBLE(10, 2),
      allowNull: true,
      defaultValue: null,
    },
    offline_price: {
      type: DataTypes.DOUBLE(10, 2),
      allowNull: true,
      defaultValue: null,
    },
    reseller_price: {
      type: DataTypes.DOUBLE(10, 2),
      allowNull: true,
      defaultValue: null,
    },
    online_stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    offline_stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    reseller_stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    counter_pre_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: "perhitungan pre order bertambah dan berkurang",
    },
  },
  {
    tableName: "meta_values", // adjust if your actual table name differs
    createdAt: "created_at",
    updatedAt: "updated_at",
    timestamps: true,
    paranoid: false,
    underscored: true,
  }
);

module.exports = MetaValues;

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ProductRab = sequelize.define(
  "ProductRab",
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
    attribute_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    price: {
      type: DataTypes.DOUBLE(10, 2),
      allowNull: true,
      defaultValue: null,
    },
    total: {
      type: DataTypes.DOUBLE(10, 2),
      allowNull: true,
      defaultValue: null,
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "product_rab", // adjust if your table name differs
    createdAt: "created_at",
    updatedAt: "updated_at",
    timestamps: true,
    paranoid: false,
    underscored: true,
  }
);

module.exports = ProductRab;

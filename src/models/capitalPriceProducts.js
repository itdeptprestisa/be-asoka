const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CapitalPriceProducts = sequelize.define(
  "CapitalPriceProducts",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
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
    city_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    product_code: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    capital_price: {
      type: DataTypes.DOUBLE(10, 2),
      allowNull: true,
    },
  },
  {
    tableName: "capital_price_products", // adjust if your actual table name differs
    createdAt: "created_at",
    updatedAt: "updated_at",
    timestamps: true,
    paranoid: false,
    underscored: true,
  }
);

module.exports = CapitalPriceProducts;

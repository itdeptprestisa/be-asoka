const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ProductAttributePivot = sequelize.define(
  "ProductAttributePivot",
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
    product_attribute_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "product_attribute_pivot", // adjust to your actual table name
    createdAt: "created_at",
    updatedAt: "updated_at",
    timestamps: true,
    paranoid: false,
    underscored: true,
  }
);

module.exports = ProductAttributePivot;

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ProductHighlight = sequelize.define(
  "ProductHighlight",
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
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    product_ids: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      comment:
        "Stores multiple product IDs (likely as a comma-separated list or JSON)",
    },
  },
  {
    tableName: "product_highlight", // adjust if your actual table name differs
    createdAt: "created_at",
    updatedAt: "updated_at",
    timestamps: true,
    paranoid: false,
    underscored: true,
  }
);

module.exports = ProductHighlight;

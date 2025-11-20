const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ProductAttribute = sequelize.define(
  "ProductAttribute",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    alias: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
      comment: "ukuran = P x L",
    },
    parent_id: {
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    size_group: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "product_attribute", // adjust if your table name differs
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

module.exports = ProductAttribute;

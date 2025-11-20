const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ProductAttributeTo = sequelize.define(
  "ProductAttributeTo",
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    occasion: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    type: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    color: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    length: {
      type: DataTypes.DOUBLE(10, 2),
      allowNull: false,
    },
    width: {
      type: DataTypes.DOUBLE(10, 2),
      allowNull: false,
    },
    height: {
      type: DataTypes.DOUBLE(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "product_attribute_to", // adjust if your table name differs
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    timestamps: true,
    paranoid: true, // enables soft deletes using deleted_at
    underscored: true,
  }
);

module.exports = ProductAttributeTo;

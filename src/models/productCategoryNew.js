const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ProductCategoryNew = sequelize.define(
  "ProductCategoryNew",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      primaryKey: true,
    },
    parent: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    alias: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    level: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    code: {
      type: DataTypes.STRING(191),
      allowNull: true,
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
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    app: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    last_child: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    back_color: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    tableName: "product_category_new",
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

module.exports = ProductCategoryNew;

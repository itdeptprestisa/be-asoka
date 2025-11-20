const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Roles = sequelize.define(
  "Roles",
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
    name: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    special: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: "roles",
    createdAt: "created_at",
    updatedAt: "updated_at",
    timestamps: true, // handles created_at and updated_at
    underscored: true, // snake_case columns
  }
);

module.exports = Roles;

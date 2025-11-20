const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Logs = sequelize.define(
  "Logs",
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
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "logs",
    createdAt: "created_at",
    updatedAt: "updated_at",
    timestamps: true, // handles created_at and updated_at
    underscored: true, // snake_case columns
  }
);

module.exports = Logs;

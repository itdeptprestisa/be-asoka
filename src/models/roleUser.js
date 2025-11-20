const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const RoleUser = sequelize.define(
  "RoleUser",
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
    role_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    tableName: "role_user",
    createdAt: "created_at",
    updatedAt: "updated_at",
    timestamps: true, // handles created_at and updated_at
    underscored: true, // snake_case columns
  }
);

module.exports = RoleUser;

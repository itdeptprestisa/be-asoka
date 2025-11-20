const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PermissionRole = sequelize.define(
  "PermissionRole",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    permission_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    role_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
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
  },
  {
    tableName: "permission_role", // adjust if your table name differs
    createdAt: "created_at",
    updatedAt: "updated_at",
    timestamps: true,
    paranoid: false,
    underscored: true,
  }
);

module.exports = PermissionRole;

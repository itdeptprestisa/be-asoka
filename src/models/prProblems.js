const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PrProblems = sequelize.define(
  "PrProblems",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    jenis_masalah: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    pesan: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    pr_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    customer_phone: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    owner: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status_log: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
  },
  {
    tableName: "pr_problems",
    timestamps: true, // since you have created_at and updated_at
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Associations
//   PrProblem.associate = (models) => {
//     PrProblem.belongsTo(models.Order, { foreignKey: "order_id" });
//     PrProblem.belongsTo(models.User, { foreignKey: "owner" });
//     // if pr_id refers to another model, e.g. PurchaseRequest
//     PrProblem.belongsTo(models.PurchaseRequest, { foreignKey: "pr_id" });
//   };

module.exports = PrProblems;

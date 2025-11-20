const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PurchaseOrderRating = sequelize.define(
  "PurchaseOrderRating",
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
    po_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    rating_location_image: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true,
      defaultValue: null,
    },
    flower_rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true,
      defaultValue: null,
    },
    flower_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    cs_rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true,
      defaultValue: null,
    },
    cs_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    rating_expired_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    log: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    rating_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: "1 = customer , 2 = sales",
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    complaint_category: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "purchase_order_rating", // adjust if your actual table name differs
    createdAt: "created_at",
    updatedAt: "updated_at",
    timestamps: true,
    paranoid: false,
    underscored: true,
  }
);

module.exports = PurchaseOrderRating;

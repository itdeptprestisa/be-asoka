const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Website = sequelize.define(
  "Website",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    view_id: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      comment: "google analytic view id",
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
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    slogan: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT("medium"),
      allowNull: false,
    },
    account_number: {
      type: DataTypes.TEXT("medium"),
      allowNull: false,
    },
    account_number_notax: {
      type: DataTypes.TEXT("medium"),
      allowNull: false,
    },
    mail_inboxes: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    sales_inboxes: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    finance_inboxes: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    purchasing_inboxes: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    logo: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    logo_white: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    primary_color: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    customer_id: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      comment: "google ads customerid",
    },
  },
  {
    tableName: "website", // change if your table name is different
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true, // enables soft delete
    deletedAt: "deleted_at",
  }
);

module.exports = Website;

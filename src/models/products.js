const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Products = sequelize.define(
  "Products",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    updated_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    deleted_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },

    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT("long"), allowNull: true },
    price: { type: DataTypes.DOUBLE(10, 2), allowNull: false },
    capital_price: {
      type: DataTypes.DOUBLE(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    sale_price: {
      type: DataTypes.DOUBLE(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    qty: {
      type: DataTypes.DOUBLE(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    image: { type: DataTypes.TEXT("long"), allowNull: true },

    country: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    province: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    city: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

    product_code: { type: DataTypes.STRING(100), allowNull: false },
    category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

    product_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: "0 = normal, 1 = custom",
    },

    tags: { type: DataTypes.TEXT("long"), allowNull: true },
    attribute: { type: DataTypes.TEXT("long"), allowNull: false },

    supplier_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    wp_id: { type: DataTypes.INTEGER, allowNull: true },

    rating: { type: DataTypes.DOUBLE(4, 0), allowNull: true },
    item_sold: { type: DataTypes.INTEGER, allowNull: true },

    image_app: { type: DataTypes.TEXT("long"), allowNull: true },
    dimension: { type: DataTypes.STRING(255), allowNull: true },

    availability: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },

    customer_app: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "1 = customer app, 0 = lavender, 2 = customer bidding",
    },

    status_capital_price: {
      type: DataTypes.STRING(25),
      allowNull: true,
      defaultValue: "",
    },

    min_price: { type: DataTypes.DOUBLE(10, 2), allowNull: true },
    suggested_price: { type: DataTypes.DOUBLE(10, 2), allowNull: true },
    max_price: { type: DataTypes.DOUBLE(10, 2), allowNull: true },
    max_suggested_price: { type: DataTypes.DOUBLE(10, 2), allowNull: true },
    discount: { type: DataTypes.DOUBLE(10, 2), allowNull: true },

    height: { type: DataTypes.INTEGER, allowNull: true },
    width: { type: DataTypes.INTEGER, allowNull: true },
    length: { type: DataTypes.INTEGER, allowNull: true },

    is_pre_order: { type: DataTypes.INTEGER, allowNull: true },
    weight: { type: DataTypes.DECIMAL(8, 2), allowNull: true },

    attribute_color: { type: DataTypes.INTEGER, allowNull: true },
    attribute_material: { type: DataTypes.INTEGER, allowNull: true },
    attribute_size: { type: DataTypes.INTEGER, allowNull: true },
    attribute_size_group: { type: DataTypes.STRING(255), allowNull: true },
    attribute_composition: { type: DataTypes.INTEGER, allowNull: true },

    buying_mode: { type: DataTypes.INTEGER, allowNull: true },
    group_category: { type: DataTypes.STRING(255), allowNull: true },
    approval_spv: { type: DataTypes.INTEGER, allowNull: true },

    additional_fee: { type: DataTypes.DOUBLE(10, 2), allowNull: true },
    management_fee: { type: DataTypes.DOUBLE(10, 2), allowNull: true },

    supplier_type: { type: DataTypes.INTEGER, allowNull: true },
    supplier_specialist_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "products", // adjust if your table name differs
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    timestamps: true,
    paranoid: true, // enables soft deletes
    underscored: true,
  }
);

module.exports = Products;

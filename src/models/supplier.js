// models/Supplier.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // adjust to your DB connection

const Supplier = sequelize.define(
  "Supplier",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: DataTypes.STRING(255),
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fbasekey: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    login: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    phone: DataTypes.STRING(255),
    website: DataTypes.STRING(255),
    operational_hour: DataTypes.TEXT("long"),
    speciality: DataTypes.TEXT("long"),
    address: DataTypes.TEXT("long"),
    country: DataTypes.INTEGER.UNSIGNED,
    province: DataTypes.INTEGER.UNSIGNED,
    city: DataTypes.INTEGER.UNSIGNED,
    contact_person: DataTypes.STRING(255),
    account_number: DataTypes.STRING(255),
    account_holder: DataTypes.STRING(255),
    bank: DataTypes.STRING(255),
    payment_terms: DataTypes.STRING(255),
    supplier_code: DataTypes.STRING(255),
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    this_week_orders: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    verified: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    banner_app: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: "https://lavender.prestisa.id/assets/images/bg-banner.jpg",
    },
    dynamic_banner: DataTypes.TEXT("long"),
    csapp_no: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    tutorial_url: {
      type: DataTypes.TEXT("medium"),
      allowNull: false,
    },
    msgbox: {
      type: DataTypes.STRING(800),
      allowNull: false,
      defaultValue: "jangan lupa tarik tagihan yaa",
    },
    force_tagihan: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    app_register: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    app_register_ktp: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    app_register_selfie: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    owner: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    owner_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    nik: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    experience: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    app_register_log: DataTypes.TEXT("long"),
    total_price_this_week: {
      type: DataTypes.MEDIUMINT,
      allowNull: false,
    },
    status_price_this_week: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    accept_tos: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    settings_id: {
      type: DataTypes.INTEGER,
      defaultValue: 4,
    },
    device_os: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    device_type: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    deleted_at: DataTypes.DATE,
    avg_point: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    wp_id: DataTypes.INTEGER,
    unlock_logs: DataTypes.TEXT("long"),
    total_item_this_week: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    total_item_this_week_parcel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    pin_code: DataTypes.STRING(50),
    saldo: DataTypes.DECIMAL(15, 2),
    saldo_ps: DataTypes.DECIMAL(15, 2),
    point: DataTypes.INTEGER,
    status_parcel_this_week: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status_this_week: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    active: DataTypes.INTEGER,
    avg_rating_to: DataTypes.INTEGER,
    app_version: DataTypes.INTEGER,
    app_register_notes: DataTypes.TEXT,
    password_error_counter: DataTypes.TINYINT,
    pin_error_counter: DataTypes.TINYINT,
    reset_password: DataTypes.STRING(12),
    reset_pin: DataTypes.STRING(12),
    transaction_logs: DataTypes.JSON,
    banks: DataTypes.TEXT("long"),
    detail_address: DataTypes.TEXT("long"),
    avg_delivery_time: {
      type: DataTypes.DOUBLE(3, 1),
      defaultValue: 0.0,
    },
    avg_response_time: {
      type: DataTypes.DOUBLE(3, 1),
      defaultValue: 0.0,
    },
    image_profile: {
      type: DataTypes.STRING(250),
      defaultValue:
        "https://dcassetcdn.com/design_img/2087714/573914/573914_11025883_2087714_f86ce87b_image.png",
    },
    staging: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    order_bid_done: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    order_app_done: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    order_auto_po_done: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sort_auto_po_daily: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    req_account_del: DataTypes.TEXT("long"),
    freeze_until: DataTypes.DATE,
    avg_rating: DataTypes.DOUBLE(4, 2),
    type: DataTypes.STRING(255),
    bank_verified: DataTypes.STRING(15),
    has_order_subdomain: DataTypes.TINYINT,
  },
  {
    tableName: "supplier",
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    timestamps: true, // handles created_at and updated_at
    paranoid: true, // handles deleted_at
    underscored: true, // snake_case columns
  }
);

module.exports = Supplier;

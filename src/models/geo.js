const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Geo = sequelize.define(
  "Geo",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    parent_id: DataTypes.INTEGER,
    left: DataTypes.INTEGER,
    right: DataTypes.INTEGER,
    depth: DataTypes.INTEGER,
    name: DataTypes.STRING,
    alternames: DataTypes.TEXT,
    country: DataTypes.STRING(2),
    level: DataTypes.STRING(10),
    population: DataTypes.BIGINT,
    lat: DataTypes.DECIMAL(9, 6),
    long: DataTypes.DECIMAL(9, 6),
    subadminarea_gmaps_api: DataTypes.STRING,
  },
  {
    tableName: "geo",
    timestamps: false,
  }
);

module.exports = Geo;

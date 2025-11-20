// config/database.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_CONNECTION,
    timezone: process.env.NODE_ENV != "production" ? "+07:00" : "-04:00",
    dialectOptions: {
      timezone: process.env.NODE_ENV != "production" ? "+07:00" : "-04:00",
      dateStrings: true,
      typeCast: function (field, next) {
        if (field.type === "DATETIME" || field.type === "TIMESTAMP") {
          return field.string();
        }
        return next();
      },
    },

    define: {
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },

    logging: false, // Set to console.log for debugging
  }
);

module.exports = sequelize;

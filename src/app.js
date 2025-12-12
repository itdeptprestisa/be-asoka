const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const app = express();
const path = require("path");
const { default: dataSource } = require("./config/dataSource");
const gojekautoRequestPickup = require("./cron/gojekAutoRequestPickup");

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Routes
app.use("/api", routes);

// Static files and views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// ✅ 404 handler - MUST come after all routes
app.use((req, res, next) => {
  res.status(404).json({ message: "Route Not Found" });
});

// ✅ Error handler - MUST come after all routes and 404 handler
app.use(errorHandler);

// ✅ Cron Jobs
gojekautoRequestPickup();

// ✅ Database initialization and server start - AFTER all middleware setup
const moment = require("moment");
const now = moment().format("DD-MM-YYYY HH:mm:ss");
const PORT = process.env.PORT || 3000;

// const { initDB } = require("./models"); // sequelize
// require("./src/queue"); to activate redis
// (async () => {
//   await initDB();
// })();

dataSource
  .initialize()
  .then(() => {
    console.log("✅ Typeorm connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} ${now}`);
    });
  })
  .catch((error) => console.log("TypeORM connection error:", error));

module.exports = app;

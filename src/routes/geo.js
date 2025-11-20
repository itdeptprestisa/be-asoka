const express = require("express");
const router = express.Router();
// const geoController = require("../controllers/geoController");
const controller = require("../new_controllers/geoController");

router.get("/search", controller.search);

module.exports = router;

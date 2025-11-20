const express = require("express");
const router = express.Router();
// const customersController = require("../controllers/customerController");
const controller = require("../new_controllers/customersController");

// router.get("/detail/:id", customersController.detail);
router.get("/detail/:id", controller.detail);
// router.get("/search", customersController.search);
router.get("/search", controller.search);

module.exports = router;

const express = require("express");
const router = express.Router();
// const supplierController = require("../controllers/supplierController");
const controller = require("../new_controllers/suppliersController");

// router.get("/nearby", supplierController.nearby);
router.get("/nearby", controller.nearby);
// router.get("/detail/:id", supplierController.detail);
router.get("/detail/:id", controller.detail);
// router.get("/search", supplierController.search);
router.get("/search", controller.search);

module.exports = router;

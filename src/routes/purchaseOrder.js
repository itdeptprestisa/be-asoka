const express = require("express");
const router = express.Router();
// const purchaseOrderController = require("../controllers/purchaseOrderController");
const controller = require("../new_controllers/purchaseOrdersController");

// router.get("/detail/:id", purchaseOrderController.detail);
router.get("/detail/:id", controller.detail);

module.exports = router;

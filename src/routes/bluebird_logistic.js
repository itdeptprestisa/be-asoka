const express = require("express");
const router = express.Router();
const authController = require("../new_controllers/bluebird_logistic/authController");
const fareController = require("../new_controllers/bluebird_logistic/fareController");
const orderController = require("../new_controllers/bluebird_logistic/orderController");
const webhookController = require("../new_controllers/bluebird_logistic/webhookController");

router.post("/auth/token", authController.getAccessToken);
router.get("/fare/price-estimation", fareController.getFarePriceEstimation);

router.post("/order/", orderController.createOrder);
router.put("/order/cancel", orderController.cancelOrder);
router.get("/order/:orderId", orderController.getOrderDetails);
router.get(
  "/order/reference/:referenceNo",
  orderController.getOrderDetailsByReference
);
router.get("/order/tracking/:orderId", orderController.getOrderTracking);

router.post("/webhook", webhookController.blueBirdWebhook);

module.exports = router;

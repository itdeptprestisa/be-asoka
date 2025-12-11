const express = require("express");
const router = express.Router();
// const geoController = require("../controllers/geoController");
const controller = require("../new_controllers/gojekController");

router.get("/shipping-estimation", controller.shippingEstimation);
router.post("/price-estimation", controller.priceEstimation);
router.post("/request-pickup-order", controller.requestPickupOrder);
router.post("/request-pickup", controller.requestPickup);
router.post("/cancel-booking", controller.bookingCancellation);
router.post("/webhook", controller.webhook);

module.exports = router;

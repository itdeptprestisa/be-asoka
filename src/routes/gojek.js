const express = require("express");
const router = express.Router();
// const geoController = require("../controllers/geoController");
const controller = require("../new_controllers/gojekController");
const otherController = require("../new_controllers/otherController");

router.get("/booking-status", controller.bookingStatus);
router.get("/shipping-estimation", controller.shippingEstimation);
router.post("/price-estimation", otherController.shippingPriceEstimation);
router.post("/request-pickup-order", controller.requestPickupOrder);
router.post("/request-pickup", controller.requestPickup);
router.post("/cancel-booking", controller.bookingCancellation);
router.post("/webhook", controller.webhook);

module.exports = router;

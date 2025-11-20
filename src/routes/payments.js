const express = require("express");
const router = express.Router();
// const paymentsController = require("../controllers/paymentsController");
const controller = require("../new_controllers/paymentsController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// router.get("/bank-list", paymentsController.bankList);
router.get("/bank-list", controller.bankList);
// router.post(
//   "/add-payment",
//   upload.single("receipt"),
//   paymentsController.addPayment
// );
router.post("/add-payment", upload.single("receipt"), controller.addPayment);
// router.post("/update-service-fee", paymentsController.updateServiceFee);
router.post("/update-service-fee", controller.updateServiceFee);

module.exports = router;

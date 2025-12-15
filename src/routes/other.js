const express = require("express");
const router = express.Router();
// const otherController = require("../controllers/otherController");
const controller = require("../new_controllers/otherController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.post("/test-ftp-file", upload.single("file"), controller.testFtpUpload);
router.post("/post-log", controller.postLog);
router.post("/shipping-price-estimation", controller.shippingPriceEstimation);

module.exports = router;

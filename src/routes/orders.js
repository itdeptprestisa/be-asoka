const express = require("express");
const router = express.Router();
const controller = require("../new_controllers/ordersController");
// const ordersController = require("../controllers/ordersController");
const popupNotifController = require("../controllers/popupNotifController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// router.get("/last", ordersController.last);
router.get("/last", controller.last);
// router.post("/rate-sales", ordersController.rateSales);
router.post("/rate-sales", controller.rateSales);
// router.post(
//   "/import-bulk-order",
//   upload.single("file"),
//   ordersController.importBulkOrder
// );
router.post(
  "/import-bulk-order",
  upload.single("file"),
  controller.importBulkOrder
);
// router.post("/update", ordersController.update);
router.post("/update", controller.update);
// router.post("/create", ordersController.create);
router.post("/create", controller.create);
// router.get("/unrated-orders", ordersController.unratedOrders);
router.get("/unrated-orders", controller.unratedOrders);
// router.post("/approve", ordersController.approveOrder);
router.post("/approve", controller.approveOrder);
// router.post("/reactive", ordersController.reactiveOrder);
router.post("/reactive", controller.reactiveOrder);
// router.post("/submit-problem", ordersController.submitProblem);
router.post("/submit-problem", controller.submitProblem);
// router.post(
//   "/submit-faktur",
//   upload.single("npwp_image"),
//   ordersController.submitFaktur
// );
router.post(
  "/submit-faktur",
  upload.single("npwp_image"),
  controller.submitFaktur
);
// router.post("/add-invoice-update", ordersController.addInvoiceUpdate);
router.post("/add-invoice-update", controller.addInvoiceUpdate);
// router.post("/lock", ordersController.lock);
router.post("/lock", controller.lock);
// router.post("/update-vip", ordersController.updateVip);
router.post("/update-vip", controller.updateVip);
// router.get("/list", ordersController.list);
router.get("/list", controller.list);
// router.get("/detail-unmasked/:id", ordersController.detailUnmasked);
router.get("/detail-unmasked/:id", controller.detailUnmasked);
// router.get("/detail/:id", ordersController.detail);
router.get("/detail/:id", controller.detail);
// router.get("/widget-state-order", ordersController.widgetStateOrder);
router.get("/widget-state-order", controller.widgetStateOrder);
router.get("/popup-add-payment-data", popupNotifController.list);

module.exports = router;

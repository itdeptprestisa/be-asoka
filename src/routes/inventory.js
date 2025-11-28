const express = require("express");
const router = express.Router();
const controller = require("../new_controllers/inventoryController");

router.get("/search-supplier", controller.searchSupplier);
router.get("/search-product", controller.searchProductEvent);
router.get("/search-po", controller.searchPo);
router.get("/spk", controller.listSpk);
router.get("/spk/get/:id", controller.getSpkDetail);
router.get("/spk/stock-monitoring", controller.stockMonitoring);
router.get("/spk/stock-monitoring/product/", controller.stockMonitoringByProduct);
router.post("/spk/create", controller.createSpk);
router.post("/spk/product/update/:id", controller.updateSpkProduct);
router.post("/spk/product/add/:spk_id", controller.addSpkProduct);
router.get("/spk/stock-movement", controller.stockMovementList);
router.post("/spk/approval/:id", controller.updateSpkStatus);
router.post("/spk/good-receipt", controller.goodReceipt);
router.get("/spk/good-receive-list/:spk_id", controller.getGoodReceive);

module.exports = router;

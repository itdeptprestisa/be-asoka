const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares");

const authRoutes = require("./auth");
const userRoutes = require("./user");
const ordersRoutes = require("./orders");
const paymentsRoutes = require("./payments");
const customersRoutes = require("./customers");
const websitesRoutes = require("./websites");
const geoRoutes = require("./geo");
const productRoutes = require("./products");
const supplierRoutes = require("./suppliers");
const publicRoutes = require("./public");
const otherController = require("./other");
const purchaseOrderController = require("./purchaseOrder");
const inventoryRoutes = require("./inventory");

router.use("/auth", authRoutes);
router.use("/user", authMiddleware, userRoutes);
router.use("/orders", authMiddleware, ordersRoutes);
router.use("/payments", authMiddleware, paymentsRoutes);
router.use("/customers", authMiddleware, customersRoutes);
router.use("/websites", authMiddleware, websitesRoutes);
router.use("/geo", authMiddleware, geoRoutes);
router.use("/products", authMiddleware, productRoutes);
router.use("/suppliers", authMiddleware, supplierRoutes);
router.use("/public", publicRoutes);
router.use("/other", otherController);
router.use("/purchase-order", purchaseOrderController);
router.use("/inventory", authMiddleware, inventoryRoutes);

module.exports = router;

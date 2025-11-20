const express = require("express");
const router = express.Router();
// const productController = require("../controllers/productController");
const controller = require("../new_controllers/productsController");

// router.get("/product-attribute", productController.productAttribute);
router.get("/product-attribute", controller.productAttribute);
// router.get("/product-category-new", productController.productCategoryNew);
router.get("/product-category-new", controller.productCategoryNew);
// router.get("/catalogue", productController.catalogue);
router.get("/catalogue", controller.catalogue);
// router.get("/search", productController.search);
router.get("/search", controller.search);
// router.get("/detail/:id", productController.detail);
router.get("/detail/:id", controller.detail);

module.exports = router;

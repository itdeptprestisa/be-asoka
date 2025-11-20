const express = require("express");
const router = express.Router();
// const websiteController = require("../controllers/websiteController");
const controller = require("../new_controllers/websitesController");

// router.get("/list", websiteController.list);
router.get("/list", controller.list);

module.exports = router;

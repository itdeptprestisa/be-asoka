const express = require("express");
const router = express.Router();
// const authController = require("../controllers/authController");
const controller = require("../new_controllers/authController");

// router.post("/login", authController.login);
router.post("/login", controller.login);

module.exports = router;

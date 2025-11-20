const express = require("express");
const router = express.Router();
// const userController = require("../controllers/userController");
const controller = require("../new_controllers/usersController");

// router.get("/permissions", userController.permissions);
router.get("/permissions", controller.permissions);
router.get("/list", controller.users);

module.exports = router;

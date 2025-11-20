const express = require("express");
const router = express.Router();
// const ordersController = require("../controllers/ordersController");
const ordersController = require("../new_controllers/ordersController");
// const multer = require("multer");
// const upload = multer({ dest: "uploads/" });

router.get("/greetings-card/view", ordersController.generateGreetingsCard);

module.exports = router;

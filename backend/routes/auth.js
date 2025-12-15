const express = require("express");
const router = express.Router();
const multer = require("multer");

const authController = require("../controllers/auth");
const { validateSignup } = require("../controllers/auth");

router.post(
  "/api/signup",
  multer().none(),
  validateSignup,
  authController.signupUser
);
router.post("/api/login", multer().none(), authController.loginUser);

module.exports = router;

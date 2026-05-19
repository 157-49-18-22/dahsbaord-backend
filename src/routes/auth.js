const express = require("express");
const { body } = require("express-validator");
const { login, logout, getMe, refreshToken } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  validate,
  login
);

// POST /api/auth/logout  (protected)
router.post("/logout", protect, logout);

// GET /api/auth/me  (protected)
router.get("/me", protect, getMe);

// POST /api/auth/refresh  (protected)
router.post("/refresh", protect, refreshToken);

module.exports = router;

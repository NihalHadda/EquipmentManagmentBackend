const router = require("express").Router();
const userCtrl = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// Admin-only: list all users
router.get("/", protect, userCtrl.getUsers);

// Get single user
router.get("/:id", protect, userCtrl.getUserById);

// Update user
router.put("/:id", protect, userCtrl.updateUser);

// Delete user
router.delete("/:id", protect, userCtrl.deleteUser);

// Forgot & reset password (public)
router.post("/forgot-password", userCtrl.forgotPassword);
router.post("/reset-password/:token", userCtrl.resetPassword);

module.exports = router;

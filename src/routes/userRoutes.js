const router = require("express").Router();
const userCtrl = require("../controllers/userController");
const { protect, authorizeRole } = require("../middleware/authMiddleware");

// Admin-only: list all users
router.get("/", protect, authorizeRole("admin"), userCtrl.getUsers);

// Get single user (admin OR owner)
router.get("/:id", protect, userCtrl.getUserById);

// Update (admin OR owner)
router.put("/:id", protect, userCtrl.updateUser);

// Delete user (admin)
router.delete("/:id", protect, authorizeRole("admin"), userCtrl.deleteUser);

module.exports = router;
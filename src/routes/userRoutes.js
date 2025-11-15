const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');

router.post("/register", ctrl.registerUser);
router.get("/:id", ctrl.getUserById);
router.get("/", ctrl.getUsers);
router.put("/:id", ctrl.updateUser);
router.delete("/:id", ctrl.deleteUser);

module.exports = router;

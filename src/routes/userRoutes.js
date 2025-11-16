import express from 'express';
import * as ctrl from '../controllers/userController.js';

const router = express.Router();

router.post("/register", ctrl.registerUser);
router.get("/", ctrl.getUsers);
router.put("/:id", ctrl.updateUser);
router.delete("/:id", ctrl.deleteUser);

export default router;
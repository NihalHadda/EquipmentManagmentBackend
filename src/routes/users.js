const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');

router.get('/', ctrl.listUsers);
router.post('/create', ctrl.createUser);
// le reste des routes

module.exports = router;

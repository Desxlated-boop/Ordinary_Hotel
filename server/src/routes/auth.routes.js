const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.get('/me', authenticate, asyncHandler(authController.me));

module.exports = router;

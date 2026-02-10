const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

router.use(authMiddleware.protect);

router.post('/create-order', authorizeMiddleware(['payment:create']), paymentsController.createOrder);
router.post('/verify-order', authorizeMiddleware(['payment:create']), paymentsController.verifyOrder);

module.exports = router;
const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

// express.json middleware changes the resp body so we cant reconstruct the signature so we avoid it for webhook route
// to get raw data for signature reconstruction and verification, we use express.raw middleware for webhook route
router.post('/webhook', express.raw({ type: 'application/json' }), paymentsController.handleWebhookEvents)

router.use(authMiddleware.protect);

router.post('/create-order', authorizeMiddleware(['payment:create']), paymentsController.createOrder);
router.post('/verify-order', authorizeMiddleware(['payment:create']), paymentsController.verifyOrder);
router.post('/create-subscription', authorizeMiddleware('payment:create'), paymentsController.createSubscription);
router.post('/capture-subscription', authorizeMiddleware('payment:create'), paymentsController.captureSubscription);

module.exports = router;
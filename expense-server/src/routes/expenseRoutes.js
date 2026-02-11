const express = require('express');
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.post('/create', authorizeMiddleware('expense:create'), expenseController.create);
router.get('/group/:groupId', authorizeMiddleware('expense:view'), expenseController.getByGroup);
router.get('/summary/:groupId', authorizeMiddleware('expense:view'), expenseController.getSummary);
router.post('/settle/:groupId', authorizeMiddleware('expense:settle'), expenseController.settleGroup);
router.put('/update', authorizeMiddleware('expense:update'), expenseController.update);
router.delete('/:expenseId', authorizeMiddleware('expense:delete'), expenseController.delete);

module.exports = router;

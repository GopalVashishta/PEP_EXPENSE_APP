const express = require('express');
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');

const router  = express.Router();

router.use(authMiddleware.protect);

router.post('/create', groupController.createGroup);
router.put('/update', groupController.update);
router.put('/members/add', groupController.addMembers);
router.put('/members/remove', groupController.removeMembers);
router.get('/my-group', groupController.getGroupByUser);
router.get('/status', groupController.getGroupByPaymentStatus);
router.get('/:groupId/audit', groupController.getAuditLog);

module.exports = router;
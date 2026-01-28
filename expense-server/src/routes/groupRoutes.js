const express = require('express');
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');

const router  = express.Router();

router.use(authMiddleware.protect);

router.post('/create', groupController.createGroup);
router.put('/update', groupController.updateGroup);
router.put('/addMembers', groupController.addMembers);
router.put('/removeMembers', groupController.removeMembers);
router.get('/byEmail', groupController.getGroupByEmail);
router.get('/byStatus', groupController.getGroupByStatus);
router.get('/auditLog', groupController.getAuditLog);

module.exports = router;
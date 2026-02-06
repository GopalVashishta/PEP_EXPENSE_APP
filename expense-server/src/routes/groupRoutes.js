const express = require('express');
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

const router  = express.Router();

router.use(authMiddleware.protect);

router.post('/create', authorizeMiddleware('group:create'), groupController.create);
router.put('/update', authorizeMiddleware('group:update'), groupController.update);
router.put('/members/add', authorizeMiddleware('group:members:add'), groupController.addMembers);
router.put('/members/remove', authorizeMiddleware('group:members:remove'), groupController.removeMembers);
router.get('/my-group', authorizeMiddleware('group:view'), groupController.getGroupByUser);
router.get('/status', authorizeMiddleware('group:view'), groupController.getGroupByPaymentStatus);
router.get('/:groupId/audit', authorizeMiddleware('group:view'), groupController.getAudit);

module.exports = router;
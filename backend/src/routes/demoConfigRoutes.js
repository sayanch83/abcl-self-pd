const express = require('express');
const { authenticateOfficer } = require('../middleware/auth');
const { getAll, create, update, remove, resetStatus } = require('../controllers/demoConfigController');

const router = express.Router();
router.use(authenticateOfficer);

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.post('/:id/reset', resetStatus);

module.exports = router;

const express = require('express');

const router = express.Router();
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', UsersController.getConnect);
router.get('/disconnect', UsersController.getDisconnect);
router.get('/users/me', UsersController.getMe);

module.exports = router;

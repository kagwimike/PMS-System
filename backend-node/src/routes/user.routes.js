const express = require('express');
const userController = require('../controllers/user.controller');
const { auth } = require('../middleware/auth.middleware');

const router = express.Router();

router
  .route('/:userId')
  .get(auth, userController.getUser)
  .patch(auth, userController.updateUser);

module.exports = router;

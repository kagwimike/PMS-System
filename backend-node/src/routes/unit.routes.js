const express = require('express');
const unitController = require('../controllers/unit.controller');
const { auth } = require('../middleware/auth.middleware');

const router = express.Router();

router
  .route('/')
  .post(auth, unitController.createUnit)
  .get(auth, unitController.getUnits);

module.exports = router;

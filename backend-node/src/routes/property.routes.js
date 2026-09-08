const express = require('express');
const propertyController = require('../controllers/property.controller');
const { auth } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router
  .route('/')
  .post(auth, upload.array('images', 10), propertyController.createProperty)
  .get(auth, propertyController.getProperties);

router
  .route('/:propertyId')
  .get(propertyController.getProperty);

module.exports = router;

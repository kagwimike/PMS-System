const express = require('express');
const maintenanceController = require('../controllers/maintenance.controller');
const { auth } = require('../middleware/auth.middleware');

const router = express.Router();

router
  .route('/requests')
  .post(auth, maintenanceController.createMaintenanceRequest)
  .get(auth, maintenanceController.getMaintenanceRequests);

router
  .route('/requests/:requestId')
  .get(auth, maintenanceController.getMaintenanceRequest);

router
  .route('/vendors')
  .post(auth, maintenanceController.createVendor)
  .get(auth, maintenanceController.getVendors);

module.exports = router;

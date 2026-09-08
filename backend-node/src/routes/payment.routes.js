const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { auth } = require('../middleware/auth.middleware');

const router = express.Router();

router
  .route('/invoices')
  .post(auth, paymentController.createInvoice)
  .get(auth, paymentController.getInvoices);

router
  .route('/invoices/:invoiceId')
  .get(auth, paymentController.getInvoice);

router
  .route('/payments')
  .post(auth, paymentController.createPayment)
  .get(auth, paymentController.getPayments);

module.exports = router;

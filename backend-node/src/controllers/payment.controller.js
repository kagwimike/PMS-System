const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const DepositRefund = require('../models/DepositRefund');
const ApiError = require('../utils/ApiError');
const { successResponse, errorResponse } = require('../utils/formatResponse');

const createInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.create(req.body);
    return successResponse(res, invoice, 'Invoice created successfully', 201);
  } catch (error) {
    console.error('Error in createInvoice:', error);
    return errorResponse(res, 'Failed to create invoice', 400, error);
  }
};

const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({ include: ['lease'] });
    return successResponse(res, invoices, 'Invoices retrieved successfully');
  } catch (error) {
    console.error('Error in getInvoices:', error);
    return errorResponse(res, 'Failed to retrieve invoices', 400, error);
  }
};

const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.invoiceId, { include: ['lease', 'payments'] });
    if (!invoice) throw new ApiError(404, 'Invoice not found');
    return successResponse(res, invoice, 'Invoice retrieved successfully');
  } catch (error) {
    console.error('Error in getInvoice:', error);
    return errorResponse(res, 'Failed to retrieve invoice', 400, error);
  }
};

const createPayment = async (req, res) => {
  try {
    const payment = await Payment.create({
      ...req.body,
      tenant_id: req.user.id
    });

    // If confirmed right away (e.g. cash payment), update invoice
    if (payment.is_confirmed) {
      const invoice = await Invoice.findByPk(payment.invoice_id);
      if (invoice) {
        invoice.amount_paid = parseFloat(invoice.amount_paid) + parseFloat(payment.amount);
        if (invoice.amount_paid >= invoice.amount) {
          invoice.status = 'PAID';
        } else {
          invoice.status = 'PARTIAL';
        }
        await invoice.save();
      }
    }

    return successResponse(res, payment, 'Payment created successfully', 201);
  } catch (error) {
    console.error('Error in createPayment:', error);
    return errorResponse(res, 'Failed to create payment', 400, error);
  }
};

const getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({ include: ['invoice', 'tenant'] });
    return successResponse(res, payments, 'Payments retrieved successfully');
  } catch (error) {
    console.error('Error in getPayments:', error);
    return errorResponse(res, 'Failed to retrieve payments', 400, error);
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoice,
  createPayment,
  getPayments
};

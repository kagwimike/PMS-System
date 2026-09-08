const MaintenanceRequest = require('../models/MaintenanceRequest');
const Vendor = require('../models/Vendor');
const ApiError = require('../utils/ApiError');
const { successResponse, errorResponse } = require('../utils/formatResponse');

const createMaintenanceRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.create({
      ...req.body,
      tenant_id: req.user.id
    });
    return successResponse(res, request, 'Maintenance Request created successfully', 201);
  } catch (error) {
    console.error('Error in createMaintenanceRequest:', error);
    return errorResponse(res, 'Failed to create maintenance request', 400, error);
  }
};

const getMaintenanceRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.findAll({ include: ['tenant', 'property', 'unit', 'assigned_vendor'] });
    return successResponse(res, requests, 'Maintenance Requests retrieved successfully');
  } catch (error) {
    console.error('Error in getMaintenanceRequests:', error);
    return errorResponse(res, 'Failed to retrieve maintenance requests', 400, error);
  }
};

const getMaintenanceRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByPk(req.params.requestId, { include: ['tenant', 'property', 'unit', 'assigned_vendor'] });
    if (!request) throw new ApiError(404, 'Maintenance Request not found');
    return successResponse(res, request, 'Maintenance Request retrieved successfully');
  } catch (error) {
    console.error('Error in getMaintenanceRequest:', error);
    return errorResponse(res, 'Failed to retrieve maintenance request', 400, error);
  }
};

const createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);
    return successResponse(res, vendor, 'Vendor created successfully', 201);
  } catch (error) {
    console.error('Error in createVendor:', error);
    return errorResponse(res, 'Failed to create vendor', 400, error);
  }
};

const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.findAll();
    return successResponse(res, vendors, 'Vendors retrieved successfully');
  } catch (error) {
    console.error('Error in getVendors:', error);
    return errorResponse(res, 'Failed to retrieve vendors', 400, error);
  }
};

module.exports = {
  createMaintenanceRequest,
  getMaintenanceRequests,
  getMaintenanceRequest,
  createVendor,
  getVendors
};

const Lease = require('../models/Lease');
const ApiError = require('../utils/ApiError');
const { successResponse, errorResponse } = require('../utils/formatResponse');

const createLease = async (req, res) => {
  try {
    const { unit_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, notes } = req.body;

    const lease = await Lease.create({
      unit_id,
      tenant_id,
      start_date,
      end_date,
      rent_amount,
      deposit_amount,
      notes,
      status: 'PENDING'
    });

    return successResponse(res, lease, 'Lease created successfully', 201);
  } catch (error) {
    console.error('Error in createLease:', error);
    return errorResponse(res, 'Failed to create lease', 400, error);
  }
};

const getLeases = async (req, res) => {
  try {
    const leases = await Lease.findAll({
      include: ['unit', 'tenant']
    });
    return successResponse(res, leases, 'Leases retrieved successfully');
  } catch (error) {
    console.error('Error in getLeases:', error);
    return errorResponse(res, 'Failed to retrieve leases', 400, error);
  }
};

const getLease = async (req, res) => {
  try {
    const lease = await Lease.findByPk(req.params.leaseId, {
      include: ['unit', 'tenant']
    });
    if (!lease) {
      throw new ApiError(404, 'Lease not found');
    }
    return successResponse(res, lease, 'Lease retrieved successfully');
  } catch (error) {
    console.error('Error in getLease:', error);
    return errorResponse(res, 'Failed to retrieve lease', 400, error);
  }
};

module.exports = {
  createLease,
  getLeases,
  getLease
};

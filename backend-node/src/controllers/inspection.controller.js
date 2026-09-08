const Inspection = require('../models/Inspection');
const Damage = require('../models/Damage');
const ApiError = require('../utils/ApiError');
const { successResponse, errorResponse } = require('../utils/formatResponse');

const createInspection = async (req, res) => {
  try {
    const inspection = await Inspection.create({
      ...req.body,
      inspector_id: req.user.id
    });
    return successResponse(res, inspection, 'Inspection created successfully', 201);
  } catch (error) {
    console.error('Error in createInspection:', error);
    return errorResponse(res, 'Failed to create inspection', 400, error);
  }
};

const getInspections = async (req, res) => {
  try {
    const inspections = await Inspection.findAll({ include: ['lease', 'inspector', 'damages'] });
    return successResponse(res, inspections, 'Inspections retrieved successfully');
  } catch (error) {
    console.error('Error in getInspections:', error);
    return errorResponse(res, 'Failed to retrieve inspections', 400, error);
  }
};

const getInspection = async (req, res) => {
  try {
    const inspection = await Inspection.findByPk(req.params.inspectionId, { include: ['lease', 'inspector', 'damages'] });
    if (!inspection) throw new ApiError(404, 'Inspection not found');
    return successResponse(res, inspection, 'Inspection retrieved successfully');
  } catch (error) {
    console.error('Error in getInspection:', error);
    return errorResponse(res, 'Failed to retrieve inspection', 400, error);
  }
};

const createDamage = async (req, res) => {
  try {
    const damage = await Damage.create(req.body);
    return successResponse(res, damage, 'Damage created successfully', 201);
  } catch (error) {
    console.error('Error in createDamage:', error);
    return errorResponse(res, 'Failed to create damage', 400, error);
  }
};

module.exports = {
  createInspection,
  getInspections,
  getInspection,
  createDamage
};

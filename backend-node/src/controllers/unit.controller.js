const unitService = require('../services/unit.service');
const { successResponse, errorResponse } = require('../utils/formatResponse');

const getUnits = async (req, res) => {
  try {
    // Pull optional ?property=1 from query parameters just like Django's get_queryset
    const propertyId = req.query.property;
    const units = await unitService.getUnits(propertyId);
    return successResponse(res, units, 'Units retrieved successfully');
  } catch (error) {
    console.error('Error in getUnits:', error);
    return errorResponse(res, 'Failed to retrieve units', 400, error);
  }
};

const createUnit = async (req, res) => {
  try {
    const unit = await unitService.createUnit(req.body);
    return successResponse(res, unit, 'Unit created successfully', 201);
  } catch (error) {
    console.error('Error in createUnit:', error);
    return errorResponse(res, 'Failed to create unit', 400, error);
  }
};

module.exports = {
  getUnits,
  createUnit,
};

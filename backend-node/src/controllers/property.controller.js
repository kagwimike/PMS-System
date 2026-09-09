const propertyService = require('../services/property.service');
const ApiError = require('../utils/ApiError');
const { successResponse, errorResponse } = require('../utils/formatResponse');

const createProperty = async (req, res) => {
  try {
    const ownerId = req.user.id; 
    const { amenities, new_amenities, ...propertyData } = req.body;
    const images = req.files; // Array of uploaded files attached by multer
    
    // Safe parsing since form-data might send arrays as JSON strings
    const parsedAmenities = amenities ? JSON.parse(amenities) : [];
    const parsedNewAmenities = new_amenities ? JSON.parse(new_amenities) : [];

    const property = await propertyService.createProperty(propertyData, ownerId, images, parsedAmenities, parsedNewAmenities);
    return successResponse(res, property, 'Property created successfully', 201);
  } catch (error) {
    console.error('Error in createProperty:', error);
    return errorResponse(res, 'Failed to create property', 400, error);
  }
};

const { getPagination, getPagingData } = require('../utils/pagination');

const getProperties = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { limit: size, offset } = getPagination(page, limit);
    const data = await propertyService.getProperties(req.user, size, offset);
    const { rows, meta } = getPagingData(data, page, size);
    
    return successResponse(res, rows, 'Properties retrieved successfully', 200, meta);
  } catch (error) {
    console.error('Error in getProperties:', error);
    return errorResponse(res, 'Failed to retrieve properties', 400, error);
  }
};

const getProperty = async (req, res) => {
  try {
    const property = await propertyService.getPropertyById(req.params.propertyId);
    return successResponse(res, property, 'Property retrieved successfully');
  } catch (error) {
    console.error('Error in getProperty:', error);
    return errorResponse(res, 'Failed to retrieve property', 400, error);
  }
};

const updateProperty = async (req, res) => {
  try {
    const property = await propertyService.updateProperty(req.params.propertyId, req.body);
    return successResponse(res, property, 'Property updated successfully');
  } catch (error) {
    console.error('Error in updateProperty:', error);
    return errorResponse(res, 'Failed to update property', 400, error);
  }
};

const deleteProperty = async (req, res) => {
  try {
    const property = await propertyService.deleteProperty(req.params.propertyId);
    return successResponse(res, property, 'Property deleted successfully');
  } catch (error) {
    console.error('Error in deleteProperty:', error);
    return errorResponse(res, 'Failed to delete property', 400, error);
  }
};

module.exports = {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty
};

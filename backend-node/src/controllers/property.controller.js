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

const getProperties = async (req, res) => {
  try {
    const properties = await propertyService.getProperties(req.user);
    return successResponse(res, properties, 'Properties retrieved successfully');
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

module.exports = {
  createProperty,
  getProperties,
  getProperty,
};

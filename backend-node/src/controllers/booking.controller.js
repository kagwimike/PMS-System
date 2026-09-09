const bookingService = require('../services/booking.service');
const { successResponse, errorResponse } = require('../utils/formatResponse');

const createBooking = async (req, res) => {
  try {
    const guestId = req.user.id;
    const booking = await bookingService.createBooking(req.body, req.user);
    return successResponse(res, booking, 'Booking created successfully', 201);
  } catch (error) {
    console.error('Error in createBooking:', error);
    return errorResponse(res, 'Failed to create booking', 400, error);
  }
};

const { getPagination, getPagingData } = require('../utils/pagination');

const getBookings = async (req, res) => {
  try {
    const { page, limit, property: propertyId } = req.query;
    const { limit: size, offset } = getPagination(page, limit);
    const data = await bookingService.getBookings(propertyId, size, offset);
    const { rows, meta } = getPagingData(data, page, size);
    
    return successResponse(res, rows, 'Bookings retrieved successfully', 200, meta);
  } catch (error) {
    console.error('Error in getBookings:', error);
    return errorResponse(res, 'Failed to retrieve bookings', 400, error);
  }
};

module.exports = {
  createBooking,
  getBookings,
};

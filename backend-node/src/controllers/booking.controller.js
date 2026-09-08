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

const getBookings = async (req, res) => {
  try {
    const guestId = req.user.id;
    const propertyId = req.query.property;
    const bookings = await bookingService.getBookings(propertyId);
    return successResponse(res, bookings, 'Bookings retrieved successfully');
  } catch (error) {
    console.error('Error in getBookings:', error);
    return errorResponse(res, 'Failed to retrieve bookings', 400, error);
  }
};

module.exports = {
  createBooking,
  getBookings,
};

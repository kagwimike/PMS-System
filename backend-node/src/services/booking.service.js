const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');

const createBooking = async (bookingBody, guestId) => {
  return Booking.create({ ...bookingBody, guest_id: guestId });
};

const getBookings = async (guestId) => {
  return Booking.findAll({ where: { guest_id: guestId } });
};

const updateBookingStatus = async (id, status) => {
  const booking = await Booking.findByPk(id);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }
  booking.status = status;
  await booking.save();
  return booking;
};

module.exports = {
  createBooking,
  getBookings,
  updateBookingStatus,
};

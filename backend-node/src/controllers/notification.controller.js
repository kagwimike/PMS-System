const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/formatResponse');

const { getPagination, getPagingData } = require('../utils/pagination');

const getNotifications = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { limit: size, offset } = getPagination(page, limit);
    const data = await Notification.findAndCountAll({
      where: { recipient_id: req.user.id },
      limit: size,
      offset
    });
    const { rows, meta } = getPagingData(data, page, size);
    return successResponse(res, rows, 'Notifications retrieved successfully', 200, meta);
  } catch (error) {
    console.error('Error in getNotifications:', error);
    return errorResponse(res, 'Failed to retrieve notifications', 400, error);
  }
};

const createNotification = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    return successResponse(res, notification, 'Notification created successfully', 201);
  } catch (error) {
    console.error('Error in createNotification:', error);
    return errorResponse(res, 'Failed to create notification', 400, error);
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.notificationId, recipient_id: req.user.id }
    });
    if (notification) {
      notification.read = true;
      await notification.save();
    }
    return successResponse(res, notification, 'Notification marked as read');
  } catch (error) {
    console.error('Error in markAsRead:', error);
    return errorResponse(res, 'Failed to mark notification as read', 400, error);
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead
};

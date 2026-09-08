const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/formatResponse');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { recipient_id: req.user.id }
    });
    return successResponse(res, notifications, 'Notifications retrieved successfully');
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

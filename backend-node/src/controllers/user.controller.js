const userService = require('../services/user.service');
const { successResponse, errorResponse } = require('../utils/formatResponse');

const getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.userId);
    return successResponse(res, user, 'User retrieved successfully');
  } catch (error) {
    console.error('Error in getUser:', error);
    return errorResponse(res, 'Failed to retrieve user', 400, error);
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUserById(req.params.userId, req.body);
    return successResponse(res, user, 'User updated successfully');
  } catch (error) {
    console.error('Error in updateUser:', error);
    return errorResponse(res, 'Failed to update user', 400, error);
  }
};

module.exports = {
  getUser,
  updateUser,
};

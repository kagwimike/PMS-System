const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const getUserById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

const updateUserById = async (id, updateBody) => {
  const user = await getUserById(id);
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

module.exports = {
  getUserById,
  updateUserById,
};

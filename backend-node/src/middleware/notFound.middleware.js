const ApiError = require('../utils/ApiError');

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, 'Not found'));
};

module.exports = notFoundHandler;

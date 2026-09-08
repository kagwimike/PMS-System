const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const logger = require('../utils/logger');
const { Sequelize } = require('sequelize');
const { errorResponse } = require('../utils/formatResponse');

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error instanceof Sequelize.Error ? 400 : 500);
    const message = error.message || 'Something went wrong';
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  if (env.env === 'production' && !err.isOperational) {
    statusCode = 500;
    message = 'Internal Server Error';
  }

  res.locals.errorMessage = err.message;

  if (env.env === 'development') {
    logger.error(err);
  }

  return errorResponse(res, message, statusCode, err);
};

module.exports = {
  errorConverter,
  errorHandler,
};

const ApiError = require('../utils/apiError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Invalid resource identifier: ${err.value}`;
    error = new ApiError(400, message);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. It must be unique.`;
    error = new ApiError(409, message);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ApiError(400, 'Validation Failed', messages);
  }

  // Handle JSON Web Token errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authorization token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authorization token has expired');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

module.exports = errorHandler;

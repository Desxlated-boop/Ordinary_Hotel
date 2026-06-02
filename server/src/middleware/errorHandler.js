const ApiError = require('../utils/ApiError');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      ...(err.name === 'ApiError' ? {} : process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
}

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = { errorHandler, notFoundHandler };

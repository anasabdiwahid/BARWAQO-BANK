export const errorHandler = (err, req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || `err-${Date.now()}`;
  console.error(`[BARWAQO ERROR][${correlationId}]`, err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal error occurred. Please contact Bank Support.',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    correlationId,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};


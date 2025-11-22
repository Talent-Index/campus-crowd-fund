export function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);

  if (err && err.name === 'ZodError') {
    const details = typeof err.flatten === 'function' ? err.flatten() : err.errors;

    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Invalid request data',
        details,
      },
    });
  }

  const status = err.status || 500;

  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: err.details || {},
    },
  });
}

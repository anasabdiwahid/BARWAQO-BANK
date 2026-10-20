export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Assign parsed and sanitized values
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;
    next();
  } catch (error) {
    const errorDetails = error.errors?.map((err) => ({
      field: err.path.join('.').replace(/^(body|query|params)\./, ''),
      message: err.message,
    })) || [{ message: error.message }];

    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please verify the submitted data.',
      code: 'VALIDATION_ERROR',
      errors: errorDetails,
    });
  }
};


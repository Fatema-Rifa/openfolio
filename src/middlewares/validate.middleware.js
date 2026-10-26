const ApiError = require('../utils/apiError');

/**
 * Validate incoming request payload using Zod schema
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source] !== undefined ? req[source] : {};
      const parsed = schema.parse(dataToValidate);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error.issues) {
        const errorMessages = error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`
        );
        return next(new ApiError(400, 'Invalid request data', errorMessages));
      }
      return next(error);
    }
  };
};

module.exports = validate;

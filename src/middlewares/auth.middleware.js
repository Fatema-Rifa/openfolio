const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/apiError');

/**
 * Middleware to protect routes: verifies JWT and attaches user to req.user
 */
const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication token missing. Please log in.'));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'openfolio_jwt_secret_fallback'
    );

    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return next(ApiError.unauthorized('User associated with this token no longer exists'));
    }

    if (user.isBanned) {
      return next(ApiError.forbidden('Your account has been suspended by an administrator'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('Your account is deactivated'));
    }

    // Attach user without password
    user.password = undefined;
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid authentication token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Authentication token expired. Please log in again.'));
    }
    next(error);
  }
};

/**
 * Optional authentication: attaches user if token valid, continues otherwise
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'openfolio_jwt_secret_fallback'
    );

    const user = await User.findById(decoded.id);
    if (user && !user.isBanned && user.isActive) {
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  } catch {
    // If token is invalid in optionalAuth, just proceed as guest
    req.user = null;
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param  {...string} roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `User role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

module.exports = {
  protect,
  optionalAuth,
  authorize
};

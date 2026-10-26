const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema
} = require('../validators/auth.validator');

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

router.get('/me', protect, authController.getMe);
router.put('/profile', protect, validate(updateProfileSchema), authController.updateProfile);
router.put(
  '/change-password',
  protect,
  validate(changePasswordSchema),
  authController.changePassword
);

module.exports = router;

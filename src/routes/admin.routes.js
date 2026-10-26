const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { ROLES } = require('../constants');
const {
  updateUserRoleSchema,
  banUserSchema,
  featureArticleSchema
} = require('../validators/admin.validator');

// All admin routes require authentication
router.use(protect);

// Dashboard overview metrics (Admin & Editor)
router.get(
  '/dashboard',
  authorize(ROLES.ADMIN, ROLES.EDITOR),
  adminController.getDashboardOverview
);

// Moderation: list all articles across statuses (Admin & Editor)
router.get(
  '/articles',
  authorize(ROLES.ADMIN, ROLES.EDITOR),
  adminController.listAllArticles
);

// Toggle featured status of an article (Admin & Editor)
router.patch(
  '/articles/:articleId/feature',
  authorize(ROLES.ADMIN, ROLES.EDITOR),
  validate(featureArticleSchema),
  adminController.toggleFeatureArticle
);

// User management (Admin only)
router.get('/users', authorize(ROLES.ADMIN), adminController.listUsers);

router.patch(
  '/users/:userId/role',
  authorize(ROLES.ADMIN),
  validate(updateUserRoleSchema),
  adminController.updateUserRole
);

router.patch(
  '/users/:userId/ban',
  authorize(ROLES.ADMIN),
  validate(banUserSchema),
  adminController.toggleUserBan
);

// Force delete article (Admin only)
router.delete(
  '/articles/:articleId',
  authorize(ROLES.ADMIN),
  adminController.forceDeleteArticle
);

// Trigger trending recalculation (Admin only)
router.post(
  '/recalculate-trending',
  authorize(ROLES.ADMIN),
  adminController.triggerRecalculateTrending
);

module.exports = router;

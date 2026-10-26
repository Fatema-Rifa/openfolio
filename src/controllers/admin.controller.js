const { User, Article, Topic } = require('../models');
const { ARTICLE_STATUS, ROLES } = require('../constants');
const StatsService = require('../services/stats.service');
const TrendingService = require('../services/trending.service');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc Get Admin Dashboard analytics and metrics overview
 * @route GET /api/v1/admin/dashboard
 * @access Private (Admin, Editor)
 */
const getDashboardOverview = async (req, res, next) => {
  try {
    const data = await StatsService.getDashboardOverview();
    return ApiResponse.ok(res, data, 'Admin dashboard metrics fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc List and search users with filters
 * @route GET /api/v1/admin/users
 * @access Private (Admin)
 */
const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, role, isBanned, search } = req.query;
    const query = {};

    if (role && Object.values(ROLES).includes(role)) {
      query.role = role;
    }

    if (isBanned !== undefined) {
      query.isBanned = isBanned === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-password')
        .lean(),
      User.countDocuments(query)
    ]);

    return ApiResponse.ok(
      res,
      { users },
      'Users fetched successfully',
      {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update user role (promote / demote)
 * @route PATCH /api/v1/admin/users/:userId/role
 * @access Private (Admin)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!Object.values(ROLES).includes(role)) {
      throw ApiError.badRequest('Invalid role specified');
    }

    // Protect against self-demotion from admin
    if (req.user._id.toString() === userId && role !== ROLES.ADMIN) {
      throw ApiError.badRequest('Admins cannot demote their own account');
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { role } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      throw ApiError.notFound('User not found');
    }

    return ApiResponse.ok(res, { user: updatedUser }, `User role updated to '${role}'`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Ban or unban a user
 * @route PATCH /api/v1/admin/users/:userId/ban
 * @access Private (Admin)
 */
const toggleUserBan = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isBanned } = req.body;

    if (req.user._id.toString() === userId) {
      throw ApiError.badRequest('You cannot ban your own account');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { isBanned: !!isBanned } },
      { new: true }
    ).select('-password');

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return ApiResponse.ok(
      res,
      { user },
      user.isBanned ? 'User has been banned' : 'User ban has been lifted'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Moderation: List all articles across statuses (published, draft, archived)
 * @route GET /api/v1/admin/articles
 * @access Private (Admin, Editor)
 */
const listAllArticles = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 15,
      status,
      isFeatured,
      authorId,
      search
    } = req.query;

    const query = {};

    if (status && Object.values(ARTICLE_STATUS).includes(status)) {
      query.status = status;
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true';
    }

    if (authorId) {
      query.author = authorId;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      Article.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('author', 'name username email avatar')
        .populate('topics', 'name slug color')
        .lean(),
      Article.countDocuments(query)
    ]);

    return ApiResponse.ok(
      res,
      { articles },
      'Articles fetched for moderation',
      {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Feature or unfeature an article on homepage
 * @route PATCH /api/v1/admin/articles/:articleId/feature
 * @access Private (Admin, Editor)
 */
const toggleFeatureArticle = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { isFeatured, featuredPriority = 0 } = req.body;

    const article = await Article.findById(articleId);
    if (!article) {
      throw ApiError.notFound('Article not found');
    }

    article.isFeatured = !!isFeatured;
    article.featuredPriority = featuredPriority;
    article.featuredAt = isFeatured ? new Date() : null;

    await article.save();

    return ApiResponse.ok(
      res,
      {
        articleId: article._id,
        isFeatured: article.isFeatured,
        featuredPriority: article.featuredPriority
      },
      article.isFeatured ? 'Article is now featured' : 'Article removed from featured'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Force delete an article by admin
 * @route DELETE /api/v1/admin/articles/:articleId
 * @access Private (Admin)
 */
const forceDeleteArticle = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const article = await Article.findById(articleId);

    if (!article) {
      throw ApiError.notFound('Article not found');
    }

    // Decrement author articlesCount
    await User.findByIdAndUpdate(article.author, { $inc: { articlesCount: -1 } });

    // Decrement topics articlesCount
    if (article.topics && article.topics.length > 0) {
      await Topic.updateMany({ _id: { $in: article.topics } }, { $inc: { articlesCount: -1 } });
    }

    await article.deleteOne();

    return ApiResponse.ok(res, null, 'Article permanently removed by admin');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Trigger manual recalculation of trending scores
 * @route POST /api/v1/admin/recalculate-trending
 * @access Private (Admin)
 */
const triggerRecalculateTrending = async (req, res, next) => {
  try {
    const count = await TrendingService.recalculateRecentScores(30);
    return ApiResponse.ok(
      res,
      { updatedArticlesCount: count },
      `Recalculated trending scores for ${count} articles`
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardOverview,
  listUsers,
  updateUserRole,
  toggleUserBan,
  listAllArticles,
  toggleFeatureArticle,
  forceDeleteArticle,
  triggerRecalculateTrending
};

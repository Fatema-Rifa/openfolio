const FeedService = require('../services/feed.service');
const { Article, Topic } = require('../models');
const { ARTICLE_STATUS } = require('../constants');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc Get personalized feed for the authenticated user
 * @route GET /api/v1/feed/personalized
 * @access Private
 */
const getPersonalizedFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const feed = await FeedService.getPersonalizedFeed(req.user._id, { page, limit });

    return ApiResponse.ok(
      res,
      {
        articles: feed.articles,
        feedType: feed.feedType
      },
      'Personalized feed generated',
      feed.pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get pure author subscriptions feed (strictly authors the user follows)
 * @route GET /api/v1/feed/following
 * @access Private
 */
const getFollowingFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const feed = await FeedService.getFollowingFeed(req.user._id, { page, limit });

    return ApiResponse.ok(
      res,
      {
        articles: feed.articles,
        message: feed.message || null
      },
      'Following feed fetched',
      feed.pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get dedicated feed for a specific topic
 * @route GET /api/v1/feed/topic/:slug
 * @access Public
 */
const getTopicFeed = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 10, sort = 'latest' } = req.query;

    const topic = await Topic.findOne({ slug: slug.toLowerCase() });
    if (!topic) {
      throw ApiError.notFound(`Topic '${slug}' not found`);
    }

    const query = {
      topics: topic._id,
      status: ARTICLE_STATUS.PUBLISHED
    };

    let sortOptions = { publishedAt: -1 };
    if (sort === 'trending') {
      sortOptions = { trendingScore: -1, publishedAt: -1 };
    } else if (sort === 'popular') {
      sortOptions = { viewsCount: -1, clapsCount: -1 };
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      Article.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .populate('author', 'name username avatar bio followersCount')
        .populate('topics', 'name slug color icon')
        .lean(),
      Article.countDocuments(query)
    ]);

    return ApiResponse.ok(
      res,
      {
        topic,
        articles
      },
      `Feed for #${topic.name}`,
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

module.exports = {
  getPersonalizedFeed,
  getFollowingFeed,
  getTopicFeed
};

const { ARTICLE_STATUS } = require('../constants');
const { Article, User } = require('../models');

class FeedService {
  /**
   * Builds personalized feed for authenticated user:
   * Combines followed authors + followed topics + high-engagement recommendations
   * @param {string} userId
   * @param {Object} options
   */
  static async getPersonalizedFeed(userId, { page = 1, limit = 10 }) {
    const user = await User.findById(userId).select('followedAuthors followedTopics');
    const skip = (page - 1) * limit;

    const hasFollowedAuthors = user && user.followedAuthors && user.followedAuthors.length > 0;
    const hasFollowedTopics = user && user.followedTopics && user.followedTopics.length > 0;

    let matchCriteria = { status: ARTICLE_STATUS.PUBLISHED };

    if (hasFollowedAuthors || hasFollowedTopics) {
      const orClauses = [];
      if (hasFollowedAuthors) {
        orClauses.push({ author: { $in: user.followedAuthors } });
      }
      if (hasFollowedTopics) {
        orClauses.push({ topics: { $in: user.followedTopics } });
      }
      // Also include featured articles to keep feed fresh
      orClauses.push({ isFeatured: true });

      matchCriteria.$or = orClauses;
    }

    const [articles, total] = await Promise.all([
      Article.find(matchCriteria)
        .sort({ publishedAt: -1, trendingScore: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('author', 'name username avatar bio followersCount')
        .populate('topics', 'name slug color icon')
        .lean(),
      Article.countDocuments(matchCriteria)
    ]);

    // Fallback: If personalized query returned fewer results than limit, supplement with top/trending
    let finalArticles = articles;
    if (finalArticles.length < limit && page === 1) {
      const existingIds = new Set(finalArticles.map((a) => a._id.toString()));
      const fallbackArticles = await Article.find({
        status: ARTICLE_STATUS.PUBLISHED,
        _id: { $nin: Array.from(existingIds) }
      })
        .sort({ trendingScore: -1, publishedAt: -1 })
        .limit(limit - finalArticles.length)
        .populate('author', 'name username avatar bio followersCount')
        .populate('topics', 'name slug color icon')
        .lean();

      finalArticles = [...finalArticles, ...fallbackArticles];
    }

    return {
      articles: finalArticles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Math.max(total, finalArticles.length),
        totalPages: Math.ceil(Math.max(total, finalArticles.length) / limit)
      },
      feedType: hasFollowedAuthors || hasFollowedTopics ? 'personalized' : 'curated_discovery'
    };
  }

  /**
   * Pure "Following" feed: only articles published by authors the user follows
   * @param {string} userId
   * @param {Object} options
   */
  static async getFollowingFeed(userId, { page = 1, limit = 10 }) {
    const user = await User.findById(userId).select('followedAuthors');
    if (!user || !user.followedAuthors || user.followedAuthors.length === 0) {
      return {
        articles: [],
        pagination: { page: Number(page), limit: Number(limit), total: 0, totalPages: 0 },
        message: 'You are not following any authors yet. Follow authors to populate this feed.'
      };
    }

    const skip = (page - 1) * limit;
    const query = {
      status: ARTICLE_STATUS.PUBLISHED,
      author: { $in: user.followedAuthors }
    };

    const [articles, total] = await Promise.all([
      Article.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('author', 'name username avatar bio followersCount')
        .populate('topics', 'name slug color icon')
        .lean(),
      Article.countDocuments(query)
    ]);

    return {
      articles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = FeedService;

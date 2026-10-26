const { ARTICLE_STATUS } = require('../constants');
const { Article } = require('../models');

/**
 * Calculates trending score based on Hacker News style gravity decay formula:
 * Score = (P - 1) / (T + 2)^G
 * where P = weighted engagement (views + claps*3 + comments*4 + bookmarks*2)
 * T = hours since publication
 * G = gravity factor (typically 1.5)
 */
class TrendingService {
  /**
   * Calculate score for a single article instance
   * @param {Object} article
   * @returns {number}
   */
  static calculateScore(article) {
    const views = article.viewsCount || 0;
    const claps = article.clapsCount || 0;
    const comments = article.commentsCount || 0;
    const bookmarks = article.bookmarksCount || 0;

    // Engagement points
    const engagementPoints = (views * 1) + (claps * 3) + (comments * 4) + (bookmarks * 2);

    const publishedDate = article.publishedAt || article.createdAt || new Date();
    const hoursSincePublished = Math.max(
      0.1,
      (Date.now() - new Date(publishedDate).getTime()) / (1000 * 60 * 60)
    );

    const gravity = 1.5;
    const score = engagementPoints / Math.pow(hoursSincePublished + 2, gravity);
    return Math.round(score * 1000) / 1000;
  }

  /**
   * Recalculates trending score for all published articles within the last N days
   * @param {number} days
   */
  static async recalculateRecentScores(days = 14) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const articles = await Article.find({
      status: ARTICLE_STATUS.PUBLISHED,
      publishedAt: { $gte: cutoffDate }
    }).select('viewsCount clapsCount commentsCount bookmarksCount publishedAt createdAt');

    const bulkOps = articles.map((article) => {
      const score = TrendingService.calculateScore(article);
      return {
        updateOne: {
          filter: { _id: article._id },
          update: {
            $set: {
              trendingScore: score,
              lastCalculatedTrendingAt: new Date()
            }
          }
        }
      };
    });

    if (bulkOps.length > 0) {
      await Article.bulkWrite(bulkOps);
    }

    return bulkOps.length;
  }

  /**
   * Fetch top trending articles
   * @param {Object} options
   */
  static async getTrendingArticles({ limit = 10, page = 1, topicId = null }) {
    const query = { status: ARTICLE_STATUS.PUBLISHED };
    if (topicId) {
      query.topics = topicId;
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      Article.find(query)
        .sort({ trendingScore: -1, viewsCount: -1, publishedAt: -1 })
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

module.exports = TrendingService;

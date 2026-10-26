const { ARTICLE_STATUS, ROLES } = require('../constants');
const { Article, User, Topic, Comment, Clap } = require('../models');

class StatsService {
  /**
   * Comprehensive metrics for the Admin Dashboard
   */
  static async getDashboardOverview() {
    const [
      totalUsers,
      totalAuthors,
      totalArticles,
      publishedArticles,
      draftArticles,
      featuredArticles,
      totalTopics,
      totalComments,
      engagementStats
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: { $in: [ROLES.AUTHOR, ROLES.EDITOR, ROLES.ADMIN] } }),
      Article.countDocuments(),
      Article.countDocuments({ status: ARTICLE_STATUS.PUBLISHED }),
      Article.countDocuments({ status: ARTICLE_STATUS.DRAFT }),
      Article.countDocuments({ isFeatured: true, status: ARTICLE_STATUS.PUBLISHED }),
      Topic.countDocuments(),
      Comment.countDocuments({ isDeleted: false }),
      Article.aggregate([
        { $match: { status: ARTICLE_STATUS.PUBLISHED } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$viewsCount' },
            totalClaps: { $sum: '$clapsCount' },
            totalBookmarks: { $sum: '$bookmarksCount' },
            avgReadingTime: { $avg: '$readingTime' }
          }
        }
      ])
    ]);

    const engagement = engagementStats[0] || {
      totalViews: 0,
      totalClaps: 0,
      totalBookmarks: 0,
      avgReadingTime: 0
    };

    // User growth in the last 7 days vs previous 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [recentUsers, previousUsers, recentArticles] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      Article.countDocuments({ publishedAt: { $gte: sevenDaysAgo } })
    ]);

    // Top authors by total views and followers
    const topAuthors = await User.find({ isBanned: false })
      .sort({ followersCount: -1, articlesCount: -1 })
      .limit(5)
      .select('name username avatar followersCount articlesCount role')
      .lean();

    // Top topics by article count
    const topTopics = await Topic.find()
      .sort({ articlesCount: -1, followersCount: -1 })
      .limit(6)
      .select('name slug articlesCount followersCount color')
      .lean();

    return {
      metrics: {
        users: {
          total: totalUsers,
          authors: totalAuthors,
          newLast7Days: recentUsers,
          previousPeriod: previousUsers,
          growthRate: previousUsers === 0 ? 100 : Math.round(((recentUsers - previousUsers) / previousUsers) * 100)
        },
        articles: {
          total: totalArticles,
          published: publishedArticles,
          drafts: draftArticles,
          featured: featuredArticles,
          publishedLast7Days: recentArticles
        },
        engagement: {
          totalViews: engagement.totalViews,
          totalClaps: engagement.totalClaps,
          totalBookmarks: engagement.totalBookmarks,
          totalComments,
          avgReadingTimeMinutes: Math.round(engagement.avgReadingTime || 0)
        },
        topicsCount: totalTopics
      },
      topAuthors,
      topTopics
    };
  }
}

module.exports = StatsService;

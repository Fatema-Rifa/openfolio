const { Article, User, Topic, Clap, Bookmark } = require('../models');
const { ARTICLE_STATUS, ROLES } = require('../constants');
const { createSlug } = require('../utils/slug');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const TrendingService = require('../services/trending.service');

/**
 * @desc Create new article
 * @route POST /api/v1/articles
 * @access Private (Author, Editor, Admin)
 */
const createArticle = async (req, res, next) => {
  try {
    const { title, subtitle, content, coverImage, topics, tags, status } = req.body;

    // Generate unique slug
    let slug = createSlug(title, false);
    const existingArticle = await Article.findOne({ slug });
    if (existingArticle) {
      slug = createSlug(title, true);
    }

    // Resolve topic IDs if topic slugs or names provided
    let topicIds = [];
    if (topics && topics.length > 0) {
      const foundTopics = await Topic.find({
        $or: [{ _id: { $in: topics.filter((t) => t.match(/^[0-9a-fA-F]{24}$/)) } }, { slug: { $in: topics } }]
      });
      topicIds = foundTopics.map((t) => t._id);
    }

    const article = await Article.create({
      title,
      slug,
      subtitle: subtitle || '',
      content,
      coverImage: coverImage || undefined,
      author: req.user._id,
      topics: topicIds,
      tags: tags || [],
      status: status || ARTICLE_STATUS.DRAFT,
      publishedAt: status === ARTICLE_STATUS.PUBLISHED ? new Date() : null
    });

    // Increment author articles count
    await User.findByIdAndUpdate(req.user._id, { $inc: { articlesCount: 1 } });

    // Increment topic articles count
    if (topicIds.length > 0) {
      await Topic.updateMany({ _id: { $in: topicIds } }, { $inc: { articlesCount: 1 } });
    }

    const populatedArticle = await Article.findById(article._id)
      .populate('author', 'name username avatar bio')
      .populate('topics', 'name slug color icon');

    return ApiResponse.created(res, { article: populatedArticle }, 'Article created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all articles with filtering, searching, and sorting
 * @route GET /api/v1/articles
 * @access Public
 */
const getArticles = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      topic,
      tag,
      author,
      search,
      sort = 'latest'
    } = req.query;

    const query = { status: ARTICLE_STATUS.PUBLISHED };

    // Topic filter
    if (topic) {
      const topicDoc = await Topic.findOne({
        $or: [{ slug: topic.toLowerCase() }, ...(topic.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: topic }] : [])]
      });
      if (topicDoc) {
        query.topics = topicDoc._id;
      }
    }

    // Tag filter
    if (tag) {
      query.tags = tag.toLowerCase();
    }

    // Author filter
    if (author) {
      const authorDoc = await User.findOne({ username: author.toLowerCase() });
      if (authorDoc) {
        query.author = authorDoc._id;
      }
    }

    // Text search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Sorting
    let sortOptions = { publishedAt: -1 };
    if (sort === 'trending') {
      sortOptions = { trendingScore: -1, publishedAt: -1 };
    } else if (sort === 'popular' || sort === 'views') {
      sortOptions = { viewsCount: -1, publishedAt: -1 };
    } else if (sort === 'claps') {
      sortOptions = { clapsCount: -1, publishedAt: -1 };
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
      { articles },
      'Articles fetched successfully',
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
 * @desc Get single article by slug & record view
 * @route GET /api/v1/articles/:slug
 * @access Public (optionalAuth for interaction states)
 */
const getArticleBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const article = await Article.findOne({ slug })
      .populate('author', 'name username avatar bio followersCount followingCount socialLinks')
      .populate('topics', 'name slug color icon');

    if (!article) {
      throw ApiError.notFound('Article not found');
    }

    // If draft or archived, only author or admin/editor can view
    if (article.status !== ARTICLE_STATUS.PUBLISHED) {
      if (
        !req.user ||
        (req.user._id.toString() !== article.author._id.toString() &&
          ![ROLES.ADMIN, ROLES.EDITOR].includes(req.user.role))
      ) {
        throw ApiError.forbidden('You do not have permission to view this unpublished article');
      }
    }

    // Increment view count and recalculate trending score
    article.viewsCount += 1;
    article.trendingScore = TrendingService.calculateScore(article);
    await article.save();

    // Check interaction states for authenticated user
    let userInteractions = {
      hasClapped: false,
      userClapsCount: 0,
      isBookmarked: false,
      isFollowingAuthor: false
    };

    if (req.user) {
      const [clap, bookmark] = await Promise.all([
        Clap.findOne({ user: req.user._id, article: article._id }),
        Bookmark.findOne({ user: req.user._id, article: article._id })
      ]);

      userInteractions = {
        hasClapped: !!clap,
        userClapsCount: clap ? clap.count : 0,
        isBookmarked: !!bookmark,
        isFollowingAuthor: req.user.followedAuthors.some(
          (id) => id.toString() === article.author._id.toString()
        )
      };
    }

    return ApiResponse.ok(
      res,
      {
        article,
        userInteractions
      },
      'Article fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update article
 * @route PUT /api/v1/articles/:slug
 * @access Private (Author, Editor, Admin)
 */
const updateArticle = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const article = await Article.findOne({ slug });

    if (!article) {
      throw ApiError.notFound('Article not found');
    }

    // Check ownership or editor/admin permissions
    const isOwner = article.author.toString() === req.user._id.toString();
    const canModerate = [ROLES.ADMIN, ROLES.EDITOR].includes(req.user.role);

    if (!isOwner && !canModerate) {
      throw ApiError.forbidden('You do not have permission to edit this article');
    }

    const { title, subtitle, content, coverImage, topics, tags, status } = req.body;

    if (title && title !== article.title) {
      article.title = title;
      // Optionally refresh slug
      const newSlug = createSlug(title, true);
      article.slug = newSlug;
    }

    if (subtitle !== undefined) article.subtitle = subtitle;
    if (content !== undefined) article.content = content;
    if (coverImage !== undefined) article.coverImage = coverImage;
    if (tags !== undefined) article.tags = tags;

    if (topics && topics.length > 0) {
      const foundTopics = await Topic.find({
        $or: [{ _id: { $in: topics.filter((t) => t.match(/^[0-9a-fA-F]{24}$/)) } }, { slug: { $in: topics } }]
      });
      article.topics = foundTopics.map((t) => t._id);
    }

    if (status && status !== article.status) {
      article.status = status;
      if (status === ARTICLE_STATUS.PUBLISHED && !article.publishedAt) {
        article.publishedAt = new Date();
      }
    }

    await article.save();

    const updatedArticle = await Article.findById(article._id)
      .populate('author', 'name username avatar bio')
      .populate('topics', 'name slug color icon');

    return ApiResponse.ok(res, { article: updatedArticle }, 'Article updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete article
 * @route DELETE /api/v1/articles/:slug
 * @access Private (Author, Admin)
 */
const deleteArticle = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const article = await Article.findOne({ slug });

    if (!article) {
      throw ApiError.notFound('Article not found');
    }

    const isOwner = article.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to delete this article');
    }

    // Decrement author articles count
    await User.findByIdAndUpdate(article.author, { $inc: { articlesCount: -1 } });

    // Decrement topic counts
    if (article.topics && article.topics.length > 0) {
      await Topic.updateMany({ _id: { $in: article.topics } }, { $inc: { articlesCount: -1 } });
    }

    await article.deleteOne();

    return ApiResponse.ok(res, null, 'Article deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Clap for an article (Medium-style claps 1-50)
 * @route POST /api/v1/articles/:slug/clap
 * @access Private
 */
const clapArticle = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { count = 1 } = req.body;

    const article = await Article.findOne({ slug, status: ARTICLE_STATUS.PUBLISHED });
    if (!article) {
      throw ApiError.notFound('Published article not found');
    }

    let clap = await Clap.findOne({ user: req.user._id, article: article._id });
    let increment = count;

    if (clap) {
      const newTotal = Math.min(50, clap.count + count);
      increment = newTotal - clap.count;
      clap.count = newTotal;
      await clap.save();
    } else {
      const initialCount = Math.min(50, count);
      increment = initialCount;
      clap = await Clap.create({
        user: req.user._id,
        article: article._id,
        count: initialCount
      });
    }

    // Update article clapsCount & recalculate trending score
    article.clapsCount += increment;
    article.trendingScore = TrendingService.calculateScore(article);
    await article.save();

    return ApiResponse.ok(
      res,
      {
        totalArticleClaps: article.clapsCount,
        userClaps: clap.count
      },
      'Clap recorded'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Toggle bookmark / save article
 * @route POST /api/v1/articles/:slug/bookmark
 * @access Private
 */
const toggleBookmark = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const article = await Article.findOne({ slug });

    if (!article) {
      throw ApiError.notFound('Article not found');
    }

    const existingBookmark = await Bookmark.findOne({
      user: req.user._id,
      article: article._id
    });

    let isBookmarked = false;
    if (existingBookmark) {
      await existingBookmark.deleteOne();
      await Article.findByIdAndUpdate(article._id, { $inc: { bookmarksCount: -1 } });
      isBookmarked = false;
    } else {
      await Bookmark.create({ user: req.user._id, article: article._id });
      await Article.findByIdAndUpdate(article._id, { $inc: { bookmarksCount: 1 } });
      isBookmarked = true;
    }

    return ApiResponse.ok(
      res,
      { isBookmarked },
      isBookmarked ? 'Article saved to reading list' : 'Article removed from reading list'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get featured articles for publication homepage
 * @route GET /api/v1/articles/featured
 * @access Public
 */
const getFeaturedArticles = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const featured = await Article.find({
      status: ARTICLE_STATUS.PUBLISHED,
      isFeatured: true
    })
      .sort({ featuredPriority: -1, featuredAt: -1, publishedAt: -1 })
      .limit(Number(limit))
      .populate('author', 'name username avatar bio followersCount')
      .populate('topics', 'name slug color icon')
      .lean();

    // Fallback: If no featured articles manually set yet, pick top clapped/viewed articles
    let articles = featured;
    if (articles.length === 0) {
      articles = await Article.find({ status: ARTICLE_STATUS.PUBLISHED })
        .sort({ clapsCount: -1, viewsCount: -1, publishedAt: -1 })
        .limit(Number(limit))
        .populate('author', 'name username avatar bio followersCount')
        .populate('topics', 'name slug color icon')
        .lean();
    }

    return ApiResponse.ok(
      res,
      {
        hero: articles[0] || null,
        featuredList: articles.slice(1)
      },
      'Featured articles fetched'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get trending articles
 * @route GET /api/v1/articles/trending
 * @access Public
 */
const getTrendingArticles = async (req, res, next) => {
  try {
    const { limit = 10, page = 1, topicId } = req.query;
    const result = await TrendingService.getTrendingArticles({ limit, page, topicId });

    return ApiResponse.ok(
      res,
      { articles: result.articles },
      'Trending articles fetched',
      result.pagination
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createArticle,
  getArticles,
  getArticleBySlug,
  updateArticle,
  deleteArticle,
  clapArticle,
  toggleBookmark,
  getFeaturedArticles,
  getTrendingArticles
};

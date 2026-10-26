const { Comment, Article } = require('../models');
const { ARTICLE_STATUS, ROLES } = require('../constants');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const TrendingService = require('../services/trending.service');

/**
 * @desc Get comments for an article
 * @route GET /api/v1/articles/:slug/comments
 * @access Public
 */
const getArticleComments = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const article = await Article.findOne({ slug });

    if (!article) {
      throw ApiError.notFound('Article not found');
    }

    const comments = await Comment.find({ article: article._id })
      .populate('author', 'name username avatar role')
      .sort({ createdAt: 1 })
      .lean();

    // Organize into threaded nested comments
    const commentMap = {};
    const rootComments = [];

    comments.forEach((c) => {
      commentMap[c._id.toString()] = { ...c, replies: [] };
    });

    comments.forEach((c) => {
      if (c.parentComment && commentMap[c.parentComment.toString()]) {
        commentMap[c.parentComment.toString()].replies.push(commentMap[c._id.toString()]);
      } else {
        rootComments.push(commentMap[c._id.toString()]);
      }
    });

    return ApiResponse.ok(res, { comments: rootComments }, 'Comments fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Add a comment or reply to an article
 * @route POST /api/v1/articles/:slug/comments
 * @access Private
 */
const addComment = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { content, parentComment } = req.body;

    const article = await Article.findOne({ slug, status: ARTICLE_STATUS.PUBLISHED });
    if (!article) {
      throw ApiError.notFound('Published article not found');
    }

    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent || parent.article.toString() !== article._id.toString()) {
        throw ApiError.badRequest('Invalid parent comment');
      }
    }

    const comment = await Comment.create({
      article: article._id,
      author: req.user._id,
      content,
      parentComment: parentComment || null
    });

    // Increment article commentsCount & recalculate trending score
    article.commentsCount += 1;
    article.trendingScore = TrendingService.calculateScore(article);
    await article.save();

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'name username avatar role'
    );

    return ApiResponse.created(res, { comment: populatedComment }, 'Comment posted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete a comment
 * @route DELETE /api/v1/comments/:commentId
 * @access Private (Comment author, Article author, Admin)
 */
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId).populate('article');

    if (!comment) {
      throw ApiError.notFound('Comment not found');
    }

    const isCommentAuthor = comment.author.toString() === req.user._id.toString();
    const isArticleAuthor = comment.article && comment.article.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isCommentAuthor && !isArticleAuthor && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to delete this comment');
    }

    // Soft delete if replies exist, else delete doc
    const hasReplies = await Comment.exists({ parentComment: comment._id });

    if (hasReplies) {
      comment.isDeleted = true;
      comment.content = '[This comment has been deleted]';
      await comment.save();
    } else {
      await comment.deleteOne();
    }

    if (comment.article) {
      await Article.findByIdAndUpdate(comment.article._id, { $inc: { commentsCount: -1 } });
    }

    return ApiResponse.ok(res, null, 'Comment removed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getArticleComments,
  addComment,
  deleteComment
};

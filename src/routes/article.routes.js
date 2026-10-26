const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article.controller');
const commentController = require('../controllers/comment.controller');
const { protect, optionalAuth, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { ROLES } = require('../constants');
const {
  createArticleSchema,
  updateArticleSchema,
  clapSchema,
  commentSchema
} = require('../validators/article.validator');

// Featured and Trending posts endpoints (placed before /:slug to prevent param clash)
router.get('/featured', articleController.getFeaturedArticles);
router.get('/trending', articleController.getTrendingArticles);

// List articles with search & filters
router.get('/', articleController.getArticles);

// Create article
router.post(
  '/',
  protect,
  authorize(ROLES.AUTHOR, ROLES.EDITOR, ROLES.ADMIN),
  validate(createArticleSchema),
  articleController.createArticle
);

// Single article view
router.get('/:slug', optionalAuth, articleController.getArticleBySlug);

// Update article
router.put(
  '/:slug',
  protect,
  validate(updateArticleSchema),
  articleController.updateArticle
);

// Delete article
router.delete('/:slug', protect, articleController.deleteArticle);

// Article interactions: Claps & Bookmarks
router.post('/:slug/clap', protect, validate(clapSchema), articleController.clapArticle);
router.post('/:slug/bookmark', protect, articleController.toggleBookmark);

// Article Comments
router.get('/:slug/comments', commentController.getArticleComments);
router.post(
  '/:slug/comments',
  protect,
  validate(commentSchema),
  commentController.addComment
);

module.exports = router;

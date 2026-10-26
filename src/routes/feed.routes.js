const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feed.controller');
const { protect } = require('../middlewares/auth.middleware');

// Personalized Feed for authenticated user (combining followed authors + followed topics)
router.get('/personalized', protect, feedController.getPersonalizedFeed);

// Following Feed (strictly authors the user subscribed to)
router.get('/following', protect, feedController.getFollowingFeed);

// Topic-specific feed
router.get('/topic/:slug', feedController.getTopicFeed);

module.exports = router;

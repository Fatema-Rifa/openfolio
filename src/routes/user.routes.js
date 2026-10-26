const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, optionalAuth } = require('../middlewares/auth.middleware');

// Current user reading list
router.get('/me/bookmarks', protect, userController.getUserBookmarks);

// Suggested authors
router.get('/suggested-authors', optionalAuth, userController.getSuggestedAuthors);

// Topic follow / unfollow for feed personalization
router.post('/topics/:topicSlug/follow', protect, userController.followTopic);
router.delete('/topics/:topicSlug/follow', protect, userController.unfollowTopic);

// Author subscriptions (follow / unfollow author)
router.post('/:username/follow', protect, userController.followAuthor);
router.delete('/:username/follow', protect, userController.unfollowAuthor);

// Author followers & following lists
router.get('/:username/followers', userController.getAuthorFollowers);
router.get('/:username/following', userController.getAuthorFollowing);

// Author public profile
router.get('/:username', optionalAuth, userController.getAuthorProfile);

module.exports = router;

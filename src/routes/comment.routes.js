const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { protect } = require('../middlewares/auth.middleware');

router.delete('/:commentId', protect, commentController.deleteComment);

module.exports = router;

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const articleRoutes = require('./article.routes');
const feedRoutes = require('./feed.routes');
const topicRoutes = require('./topic.routes');
const commentRoutes = require('./comment.routes');
const adminRoutes = require('./admin.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Openfolio API'
  });
});

// Mount resource routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/articles', articleRoutes);
router.use('/feed', feedRoutes);
router.use('/topics', topicRoutes);
router.use('/comments', commentRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

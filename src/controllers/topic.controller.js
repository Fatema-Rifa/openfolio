const { Topic, Article } = require('../models');
const { createSlug } = require('../utils/slug');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc Get all topics
 * @route GET /api/v1/topics
 * @access Public
 */
const getTopics = async (req, res, next) => {
  try {
    const { featured, search } = req.query;
    const query = {};

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const topics = await Topic.find(query)
      .sort({ articlesCount: -1, followersCount: -1 })
      .lean();

    return ApiResponse.ok(res, { topics }, 'Topics fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get single topic by slug
 * @route GET /api/v1/topics/:slug
 * @access Public
 */
const getTopicBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const topic = await Topic.findOne({ slug: slug.toLowerCase() });

    if (!topic) {
      throw ApiError.notFound('Topic not found');
    }

    return ApiResponse.ok(res, { topic }, 'Topic fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create new topic
 * @route POST /api/v1/topics
 * @access Private (Editor, Admin)
 */
const createTopic = async (req, res, next) => {
  try {
    const { name, description, icon, color, isFeatured } = req.body;
    const slug = createSlug(name);

    const existing = await Topic.findOne({ $or: [{ name }, { slug }] });
    if (existing) {
      throw ApiError.conflict('Topic with this name or slug already exists');
    }

    const topic = await Topic.create({
      name,
      slug,
      description: description || '',
      icon: icon || 'tag',
      color: color || '#3b82f6',
      isFeatured: !!isFeatured
    });

    return ApiResponse.created(res, { topic }, 'Topic created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update existing topic
 * @route PUT /api/v1/topics/:slug
 * @access Private (Editor, Admin)
 */
const updateTopic = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const topic = await Topic.findOne({ slug });

    if (!topic) {
      throw ApiError.notFound('Topic not found');
    }

    const { name, description, icon, color, isFeatured } = req.body;

    if (name && name !== topic.name) {
      topic.name = name;
      topic.slug = createSlug(name);
    }

    if (description !== undefined) topic.description = description;
    if (icon !== undefined) topic.icon = icon;
    if (color !== undefined) topic.color = color;
    if (isFeatured !== undefined) topic.isFeatured = isFeatured;

    await topic.save();

    return ApiResponse.ok(res, { topic }, 'Topic updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete a topic
 * @route DELETE /api/v1/topics/:slug
 * @access Private (Admin)
 */
const deleteTopic = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const topic = await Topic.findOne({ slug });

    if (!topic) {
      throw ApiError.notFound('Topic not found');
    }

    // Remove topic reference from articles
    await Article.updateMany(
      { topics: topic._id },
      { $pull: { topics: topic._id } }
    );

    await topic.deleteOne();

    return ApiResponse.ok(res, null, 'Topic deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTopics,
  getTopicBySlug,
  createTopic,
  updateTopic,
  deleteTopic
};

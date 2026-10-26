const { z } = require('zod');
const { ARTICLE_STATUS } = require('../constants');

const createArticleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(180),
  subtitle: z.string().max(280).optional(),
  content: z.string().min(20, 'Content must have at least 20 characters'),
  coverImage: z.string().url('Cover image must be a valid URL').optional(),
  topics: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum([ARTICLE_STATUS.DRAFT, ARTICLE_STATUS.PUBLISHED]).optional()
});

const updateArticleSchema = z.object({
  title: z.string().min(5).max(180).optional(),
  subtitle: z.string().max(280).optional(),
  content: z.string().min(20).optional(),
  coverImage: z.string().url().optional(),
  topics: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(Object.values(ARTICLE_STATUS)).optional()
});

const clapSchema = z.object({
  count: z.number().int().min(1).max(50).default(1)
});

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000),
  parentComment: z.string().optional()
});

module.exports = {
  createArticleSchema,
  updateArticleSchema,
  clapSchema,
  commentSchema
};

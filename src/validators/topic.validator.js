const { z } = require('zod');

const createTopicSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(40),
  description: z.string().max(200).optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color must be a valid hex code').optional(),
  isFeatured: z.boolean().optional()
});

const updateTopicSchema = z.object({
  name: z.string().min(2).max(40).optional(),
  description: z.string().max(200).optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
  isFeatured: z.boolean().optional()
});

module.exports = {
  createTopicSchema,
  updateTopicSchema
};

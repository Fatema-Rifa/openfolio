const { z } = require('zod');
const { ROLES } = require('../constants');

const updateUserRoleSchema = z.object({
  role: z.enum(Object.values(ROLES))
});

const banUserSchema = z.object({
  isBanned: z.boolean(),
  reason: z.string().optional()
});

const featureArticleSchema = z.object({
  isFeatured: z.boolean(),
  featuredPriority: z.number().int().min(0).max(100).optional()
});

module.exports = {
  updateUserRoleSchema,
  banUserSchema,
  featureArticleSchema
};

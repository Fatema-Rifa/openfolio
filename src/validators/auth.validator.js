const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must have at least 2 characters').max(60),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  bio: z.string().max(300).optional(),
  avatar: z.string().url('Avatar must be a valid URL').optional()
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required')
});

const updateProfileSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  bio: z.string().max(300).optional(),
  avatar: z.string().url().optional(),
  website: z.string().url().optional().or(z.literal('')),
  socialLinks: z
    .object({
      twitter: z.string().optional(),
      github: z.string().optional(),
      linkedin: z.string().optional()
    })
    .optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema
};

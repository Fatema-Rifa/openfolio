const { User } = require('../models');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc Register a new user
 * @route POST /api/v1/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { name, username, email, password, bio, avatar } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw ApiError.conflict('An account with this email address already exists');
      }
      throw ApiError.conflict('This username is already taken');
    }

    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      bio,
      avatar
    });

    const token = user.generateAuthToken();

    const userData = {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt
    };

    return ApiResponse.created(res, { user: userData, token }, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Login user & return JWT token
 * @route POST /api/v1/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() }
      ]
    }).select('+password');

    if (!user) {
      throw ApiError.unauthorized('Invalid email/username or password');
    }

    if (user.isBanned) {
      throw ApiError.forbidden('Your account has been suspended. Please contact support.');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email/username or password');
    }

    const token = user.generateAuthToken();

    const userData = {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      followedAuthorsCount: user.followedAuthors ? user.followedAuthors.length : 0,
      followedTopicsCount: user.followedTopics ? user.followedTopics.length : 0
    };

    return ApiResponse.ok(res, { user: userData, token }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get current authenticated user profile
 * @route GET /api/v1/auth/me
 * @access Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followedTopics', 'name slug color icon')
      .populate('followedAuthors', 'name username avatar bio');

    return ApiResponse.ok(res, { user }, 'User profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update user profile
 * @route PUT /api/v1/auth/profile
 * @access Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = ['name', 'bio', 'avatar', 'website', 'socialLinks'];
    const updateData = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return ApiResponse.ok(res, { user: updatedUser }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Change password
 * @route PUT /api/v1/auth/change-password
 * @access Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw ApiError.badRequest('Current password does not match');
    }

    user.password = newPassword;
    await user.save();

    return ApiResponse.ok(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};

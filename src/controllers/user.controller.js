const { User, Article, Topic, Bookmark } = require('../models');
const { ARTICLE_STATUS } = require('../constants');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc Get public author profile by username
 * @route GET /api/v1/users/:username
 * @access Public (optionalAuth for follow state)
 */
const getAuthorProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const author = await User.findOne({ username: username.toLowerCase() })
      .select('-password')
      .populate('followedTopics', 'name slug color icon');

    if (!author) {
      throw ApiError.notFound(`Author with username '@${username}' not found`);
    }

    let isFollowing = false;
    if (req.user) {
      isFollowing = req.user.followedAuthors.some(
        (id) => id.toString() === author._id.toString()
      );
    }

    const profileData = author.toObject();
    profileData.isFollowing = isFollowing;

    return ApiResponse.ok(res, { author: profileData }, 'Author profile fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Follow an author (Author Subscription)
 * @route POST /api/v1/users/:username/follow
 * @access Private
 */
const followAuthor = async (req, res, next) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user._id;

    const authorToFollow = await User.findOne({ username: username.toLowerCase() });
    if (!authorToFollow) {
      throw ApiError.notFound('Author not found');
    }

    if (authorToFollow._id.toString() === currentUserId.toString()) {
      throw ApiError.badRequest('You cannot follow yourself');
    }

    const currentUser = await User.findById(currentUserId);
    const isAlreadyFollowing = currentUser.followedAuthors.includes(authorToFollow._id);

    if (isAlreadyFollowing) {
      return ApiResponse.ok(
        res,
        { isFollowing: true, followersCount: authorToFollow.followersCount },
        'You are already following this author'
      );
    }

    // Add to followedAuthors and increment counts
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { followedAuthors: authorToFollow._id },
      $inc: { followingCount: 1 }
    });

    const updatedAuthor = await User.findByIdAndUpdate(
      authorToFollow._id,
      { $inc: { followersCount: 1 } },
      { new: true }
    );

    return ApiResponse.ok(
      res,
      {
        isFollowing: true,
        followersCount: updatedAuthor.followersCount
      },
      `Successfully subscribed to @${authorToFollow.username}`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Unfollow an author
 * @route DELETE /api/v1/users/:username/follow
 * @access Private
 */
const unfollowAuthor = async (req, res, next) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user._id;

    const authorToUnfollow = await User.findOne({ username: username.toLowerCase() });
    if (!authorToUnfollow) {
      throw ApiError.notFound('Author not found');
    }

    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.followedAuthors.includes(authorToUnfollow._id);

    if (!isFollowing) {
      return ApiResponse.ok(
        res,
        { isFollowing: false, followersCount: authorToUnfollow.followersCount },
        'You are not following this author'
      );
    }

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { followedAuthors: authorToUnfollow._id },
      $inc: { followingCount: -1 }
    });

    const updatedAuthor = await User.findByIdAndUpdate(
      authorToUnfollow._id,
      { $inc: { followersCount: -1 } },
      { new: true }
    );

    return ApiResponse.ok(
      res,
      {
        isFollowing: false,
        followersCount: Math.max(0, updatedAuthor.followersCount)
      },
      `Unsubscribed from @${authorToUnfollow.username}`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Follow a topic (Personalized Feed interest)
 * @route POST /api/v1/users/topics/:topicSlug/follow
 * @access Private
 */
const followTopic = async (req, res, next) => {
  try {
    const { topicSlug } = req.params;
    const topic = await Topic.findOne({ slug: topicSlug.toLowerCase() });
    if (!topic) {
      throw ApiError.notFound('Topic not found');
    }

    const user = await User.findById(req.user._id);
    const isFollowing = user.followedTopics.includes(topic._id);

    if (!isFollowing) {
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { followedTopics: topic._id }
      });
      await Topic.findByIdAndUpdate(topic._id, {
        $inc: { followersCount: 1 }
      });
    }

    return ApiResponse.ok(
      res,
      { isFollowing: true, topicSlug: topic.slug },
      `Now following #${topic.name}`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Unfollow a topic
 * @route DELETE /api/v1/users/topics/:topicSlug/follow
 * @access Private
 */
const unfollowTopic = async (req, res, next) => {
  try {
    const { topicSlug } = req.params;
    const topic = await Topic.findOne({ slug: topicSlug.toLowerCase() });
    if (!topic) {
      throw ApiError.notFound('Topic not found');
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { followedTopics: topic._id }
    });
    await Topic.findByIdAndUpdate(topic._id, {
      $inc: { followersCount: -1 }
    });

    return ApiResponse.ok(
      res,
      { isFollowing: false, topicSlug: topic.slug },
      `Unfollowed #${topic.name}`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get list of followers for an author
 * @route GET /api/v1/users/:username/followers
 * @access Public
 */
const getAuthorFollowers = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const author = await User.findOne({ username: username.toLowerCase() });
    if (!author) {
      throw ApiError.notFound('Author not found');
    }

    const skip = (page - 1) * limit;
    const followers = await User.find({ followedAuthors: author._id })
      .skip(skip)
      .limit(Number(limit))
      .select('name username avatar bio followersCount');

    const total = await User.countDocuments({ followedAuthors: author._id });

    return ApiResponse.ok(
      res,
      { followers },
      'Followers fetched successfully',
      { page: Number(page), limit: Number(limit), total }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get list of authors followed by a user
 * @route GET /api/v1/users/:username/following
 * @access Public
 */
const getAuthorFollowing = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() }).populate(
      'followedAuthors',
      'name username avatar bio followersCount'
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return ApiResponse.ok(
      res,
      { following: user.followedAuthors },
      'Followed authors fetched'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get reading list / bookmarked articles of current user
 * @route GET /api/v1/users/me/bookmarks
 * @access Private
 */
const getUserBookmarks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      Bookmark.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate({
          path: 'article',
          populate: [
            { path: 'author', select: 'name username avatar' },
            { path: 'topics', select: 'name slug color' }
          ]
        })
        .lean(),
      Bookmark.countDocuments({ user: req.user._id })
    ]);

    const articles = bookmarks
      .map((b) => b.article)
      .filter((art) => art && art.status === ARTICLE_STATUS.PUBLISHED);

    return ApiResponse.ok(
      res,
      { articles },
      'Bookmarks fetched successfully',
      { page: Number(page), limit: Number(limit), total }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get suggested / top authors to follow
 * @route GET /api/v1/users/suggested-authors
 * @access Public (optionalAuth)
 */
const getSuggestedAuthors = async (req, res, next) => {
  try {
    const excludeIds = req.user ? [req.user._id, ...(req.user.followedAuthors || [])] : [];

    const suggested = await User.find({
      _id: { $nin: excludeIds },
      isBanned: false,
      articlesCount: { $gt: 0 }
    })
      .sort({ followersCount: -1, articlesCount: -1 })
      .limit(6)
      .select('name username avatar bio followersCount articlesCount');

    return ApiResponse.ok(res, { authors: suggested }, 'Suggested authors to follow');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuthorProfile,
  followAuthor,
  unfollowAuthor,
  followTopic,
  unfollowTopic,
  getAuthorFollowers,
  getAuthorFollowing,
  getUserBookmarks,
  getSuggestedAuthors
};

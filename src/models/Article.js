const mongoose = require('mongoose');
const { ARTICLE_STATUS } = require('../constants');
const { calculateReadingTime } = require('../utils/readingTime');

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Article title is required'],
      trim: true,
      maxlength: [180, 'Title cannot exceed 180 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [280, 'Subtitle cannot exceed 280 characters'],
      default: ''
    },
    content: {
      type: String,
      required: [true, 'Article content is required']
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80'
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true
    },
    topics: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic'
      }
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true
      }
    ],
    status: {
      type: String,
      enum: Object.values(ARTICLE_STATUS),
      default: ARTICLE_STATUS.DRAFT,
      index: true
    },
    // Featured posts attributes
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    featuredAt: {
      type: Date,
      default: null
    },
    featuredPriority: {
      type: Number,
      default: 0
    },
    readingTime: {
      type: Number,
      default: 1
    },
    viewsCount: {
      type: Number,
      default: 0
    },
    clapsCount: {
      type: Number,
      default: 0
    },
    commentsCount: {
      type: Number,
      default: 0
    },
    bookmarksCount: {
      type: Number,
      default: 0
    },
    // Trending calculation: Hacker-News style gravity score
    trendingScore: {
      type: Number,
      default: 0,
      index: true
    },
    lastCalculatedTrendingAt: {
      type: Date,
      default: Date.now
    },
    publishedAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Auto-calculate reading time before save
articleSchema.pre('save', function () {
  if (this.isModified('content')) {
    this.readingTime = calculateReadingTime(this.content);
  }
  if (this.isModified('status') && this.status === ARTICLE_STATUS.PUBLISHED && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

// Indexes for feed, featured, trending, and full-text search
articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ status: 1, trendingScore: -1 });
articleSchema.index({ status: 1, isFeatured: 1, featuredPriority: -1 });
articleSchema.index({ author: 1, status: 1, publishedAt: -1 });
articleSchema.index({ topics: 1, status: 1, publishedAt: -1 });
articleSchema.index(
  {
    title: 'text',
    subtitle: 'text',
    tags: 'text'
  },
  {
    weights: {
      title: 10,
      tags: 5,
      subtitle: 3
    },
    name: 'article_search_index'
  }
);

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;

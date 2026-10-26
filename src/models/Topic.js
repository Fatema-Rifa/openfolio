const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Topic name is required'],
      unique: true,
      trim: true,
      maxlength: [40, 'Topic name cannot exceed 40 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    icon: {
      type: String,
      default: 'tag'
    },
    color: {
      type: String,
      default: '#3b82f6'
    },
    articlesCount: {
      type: Number,
      default: 0
    },
    followersCount: {
      type: Number,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic;

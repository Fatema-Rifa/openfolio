const mongoose = require('mongoose');

const clapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true
    },
    count: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

// Each user has at most one clap record per article
clapSchema.index({ user: 1, article: 1 }, { unique: true });

const Clap = mongoose.model('Clap', clapSchema);

module.exports = Clap;

const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true, // YYYY-MM-DD (user's local day)
    },
    text: {
      type: String,
      default: '',
      maxlength: 4000,
    },
    palette: {
      type: Number,
      default: 0,
      min: 0,
      max: 9,
    },
  },
  { timestamps: true }
);

entrySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Entry', entrySchema);

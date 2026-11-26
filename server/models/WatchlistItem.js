import mongoose from 'mongoose';

// One movie saved in one user's personal watchlist. Movie details are copied
// from TMDB when it is added, like suggestions, so the page needs no extra calls.
const watchlistItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tmdbId: { type: Number, required: true },
  title: { type: String, required: true },
  posterPath: { type: String, default: null },
  releaseDate: { type: String, default: null },
  runtime: { type: Number, default: null },      // minutes
  voteAverage: { type: Number, default: 0 },     // TMDB rating, 0-10
  watched: { type: Boolean, default: false },
  watchedAt: { type: Date, default: null },
}, { timestamps: true });

// The same film can only be saved once per user
watchlistItemSchema.index({ user: 1, tmdbId: 1 }, { unique: true });

// Matches find({ user }).sort({ createdAt: -1 }) on the watchlist page
watchlistItemSchema.index({ user: 1, createdAt: -1 });

export const WatchlistItem = mongoose.model('WatchlistItem', watchlistItemSchema);
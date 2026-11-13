import mongoose from 'mongoose';

// A film someone suggested for a night. Movie details are copied from
// TMDB when the suggestion is added, so the result never depends on TMDB.
const suggestionSchema = new mongoose.Schema({
  night: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Night',
    required: true,
  },
  tmdbId: { type: Number, required: true },
  title: { type: String, required: true },
  posterPath: { type: String, default: null },
  runtime: { type: Number, default: null },      // minutes
  voteAverage: { type: Number, default: 0 },     // TMDB rating, 0-10
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// The same film can only be suggested once per night
suggestionSchema.index({ night: 1, tmdbId: 1 }, { unique: true });

export const Suggestion = mongoose.model('Suggestion', suggestionSchema);

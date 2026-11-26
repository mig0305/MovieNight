import mongoose from 'mongoose';

// One ballot per user per night: a top-three ranking and at most one veto.
// ranking[0] is the 1st choice (3 points), ranking[1] gets 2, ranking[2] gets 1.
const voteSchema = new mongoose.Schema({
  night: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Night',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ranking: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Suggestion' }],
  veto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Suggestion',
    default: null,
  },
}, { timestamps: true });

// One ballot per user per night
voteSchema.index({ night: 1, user: 1 }, { unique: true });

export const Vote = mongoose.model('Vote', voteSchema);

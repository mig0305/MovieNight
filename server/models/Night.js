import mongoose from 'mongoose';

// One movie night. In PostgreSQL the members would be a separate
// night_members table; in MongoDB we keep them as an array of user ids.
const nightSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true, trim: true },
  joinCode: { type: String, required: true, unique: true, uppercase: true },
  maxRuntimeMin: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// S22 indexes: matches find({ members: userId }).sort({ createdAt: -1 }) on GET /api/nights
nightSchema.index({ members: 1, createdAt: -1 });

export const Night = mongoose.model('Night', nightSchema);

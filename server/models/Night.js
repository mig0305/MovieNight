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

export const Night = mongoose.model('Night', nightSchema);

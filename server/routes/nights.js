import express from 'express';
import mongoose from 'mongoose';
import { Night } from '../models/Night.js';
import { Suggestion } from '../models/Suggestion.js';
import { Vote } from '../models/Vote.js';
import { getMovie } from '../services/tmdb.js';
import { computeResult } from '../utils/scoring.js';
import { makeJoinCode } from '../utils/joinCode.js';
import {
  validateNight, validateNightUpdate,
  validateSuggestion, validateVote,
} from '../middleware/validate.js';

// Every route here runs after requireAuth (see server.js), so req.userId is set.
const nightsRouter = express.Router();

// ---------- helpers ----------

// Is it yours? Only nights you are a member of. Anything else -> null -> 404.
async function findMyNight(req) {
  if (!mongoose.isValidObjectId(req.params.id)) return null;
  return Night.findOne({ _id: req.params.id, members: req.userId });
}

const isOwner = (night, req) => night.owner.toString() === req.userId;

const notFound = (res) => res.status(404).json({ error: 'Night not found' });

// ---------- nights ----------

// GET /api/nights?status=open|closed: every night I own or joined (history)
nightsRouter.get('/', async (req, res) => {
  const { status } = req.query;
  const filter = { members: req.userId };
  if (status === 'open' || status === 'closed') filter.status = status;

  const nights = await Night.find(filter)
    .sort({ createdAt: -1 })
    .populate('owner', 'displayName');
  res.json(nights);
});

// POST /api/nights: create; I become the owner and first member
nightsRouter.post('/', validateNight, async (req, res) => {
  const { title, maxRuntimeMin } = req.body;

  // Codes are random; try again on the rare clash
  let joinCode = makeJoinCode();
  while (await Night.exists({ joinCode })) joinCode = makeJoinCode();

  const night = await Night.create({
    owner: req.userId, // owner comes from the token, never the body
    title: title.trim(),
    maxRuntimeMin,
    joinCode,
    members: [req.userId],
  });
  res.status(201).json(night);
});

// GET /api/nights/:id: the night, its members, suggestions and my ballot
// (to join a night with a code, see routes/memberships.js)
nightsRouter.get('/:id', async (req, res) => {
  const night = await findMyNight(req);
  if (!night) return notFound(res);

  await night.populate([
    { path: 'owner', select: 'displayName' },
    { path: 'members', select: 'displayName' },
  ]);
  const suggestions = await Suggestion.find({ night: night._id })
    .sort({ createdAt: 1 })
    .populate('addedBy', 'displayName');
  const myVote = await Vote.findOne({ night: night._id, user: req.userId });
  const ballotsCast = await Vote.countDocuments({ night: night._id });

  res.json({
    ...night.toObject(),
    isOwner: night.owner._id.toString() === req.userId,
    suggestions,
    myBallot: myVote ?? { ranking: [], veto: null },
    ballotsCast,
  });
});

// PATCH /api/nights/:id: owner only; changes only the fields sent
nightsRouter.patch('/:id', validateNightUpdate, async (req, res) => {
  const night = await findMyNight(req);
  if (!night) return notFound(res);
  if (!isOwner(night, req)) {
    return res.status(403).json({ error: 'Only the owner can edit this night' });
  }
  const { title, maxRuntimeMin, status } = req.body;
  if (title !== undefined) night.title = title.trim();
  if (maxRuntimeMin !== undefined) night.maxRuntimeMin = maxRuntimeMin;
  if (status !== undefined) night.status = status;
  await night.save();
  res.json(night);
});

// DELETE /api/nights/:id: owner only; removes its suggestions and votes too
nightsRouter.delete('/:id', async (req, res) => {
  const night = await findMyNight(req);
  if (!night) return notFound(res);
  if (!isOwner(night, req)) {
    return res.status(403).json({ error: 'Only the owner can delete this night' });
  }
  await Suggestion.deleteMany({ night: night._id });
  await Vote.deleteMany({ night: night._id });
  await night.deleteOne();
  res.sendStatus(204); // worked, no body
});

// ---------- suggestions ----------

// POST /api/nights/:id/suggestions  { tmdbId }
// The server looks the film up on TMDB, so runtime and rating can't be faked.
nightsRouter.post('/:id/suggestions', validateSuggestion, async (req, res) => {
  const night = await findMyNight(req);
  if (!night) return notFound(res);
  if (night.status === 'closed') {
    return res.status(400).json({ error: 'This night is closed' });
  }
  const { tmdbId } = req.body;
  if (await Suggestion.exists({ night: night._id, tmdbId })) {
    return res.status(409).json({ error: 'That film is already suggested' });
  }

  const movie = await getMovie(tmdbId); // 404 if TMDB doesn't know it
  const suggestion = await Suggestion.create({
    night: night._id,
    tmdbId: movie.tmdbId,
    title: movie.title,
    posterPath: movie.posterPath,
    runtime: movie.runtime,
    voteAverage: movie.voteAverage,
    addedBy: req.userId,
  });
  res.status(201).json(suggestion);
});

// DELETE /api/nights/:id/suggestions/:suggestionId
// You can remove your own suggestion; the owner can remove any.
nightsRouter.delete('/:id/suggestions/:suggestionId', async (req, res) => {
  const night = await findMyNight(req);
  if (!night) return notFound(res);
  if (night.status === 'closed') {
    return res.status(400).json({ error: 'This night is closed' });
  }
  const { suggestionId } = req.params;
  if (!mongoose.isValidObjectId(suggestionId)) {
    return res.status(404).json({ error: 'Suggestion not found' });
  }
  const suggestion = await Suggestion.findOne({ _id: suggestionId, night: night._id });
  if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });

  if (suggestion.addedBy.toString() !== req.userId && !isOwner(night, req)) {
    return res.status(403).json({ error: 'You can only remove your own suggestions' });
  }

  await suggestion.deleteOne();
  // Take it off every ballot in this night
  await Vote.updateMany({ night: night._id }, { $pull: { ranking: suggestion._id } });
  await Vote.updateMany({ night: night._id, veto: suggestion._id }, { veto: null });
  res.sendStatus(204);
});

// ---------- voting ----------

// GET /api/nights/:id/ballot: my ballot
nightsRouter.get('/:id/ballot', async (req, res) => {
  const night = await findMyNight(req);
  if (!night) return notFound(res);
  const vote = await Vote.findOne({ night: night._id, user: req.userId });
  res.json(vote ?? { ranking: [], veto: null });
});

// PUT /api/nights/:id/ballot  { ranking: [id1, id2, id3], veto: id | null }
// PUT replaces the whole ballot: send it all every time.
nightsRouter.put('/:id/ballot', validateVote, async (req, res) => {
  const night = await findMyNight(req);
  if (!night) return notFound(res);
  if (night.status === 'closed') {
    return res.status(400).json({ error: 'Voting is closed for this night' });
  }

  const { ranking = [], veto = null } = req.body;
  const ids = veto ? [...ranking, veto] : ranking;
  const found = await Suggestion.countDocuments({ _id: { $in: ids }, night: night._id });
  if (found !== ids.length) {
    return res.status(400).json({ error: 'Every film must be a suggestion in this night' });
  }

  const vote = await Vote.findOneAndUpdate(
    { night: night._id, user: req.userId },
    { ranking, veto },
    { new: true, upsert: true, runValidators: true },
  );
  res.json(vote);
});

// ---------- result ----------

// GET /api/nights/:id/result: winner, runners-up, and why each film lost.
// Live while the night is open; final once the owner closes it.
nightsRouter.get('/:id/result', async (req, res) => {
  const night = await findMyNight(req);
  if (!night) return notFound(res);

  const suggestions = await Suggestion.find({ night: night._id });
  const votes = await Vote.find({ night: night._id });

  const result = computeResult(
    night.maxRuntimeMin,
    suggestions.map((s) => ({
      id: s._id.toString(),
      tmdbId: s.tmdbId,
      title: s.title,
      posterPath: s.posterPath,
      runtime: s.runtime,
      voteAverage: s.voteAverage,
    })),
    votes.map((v) => ({
      ranking: v.ranking.map(String),
      veto: v.veto ? v.veto.toString() : null,
    })),
  );

  res.json({ final: night.status === 'closed', ...result });
});

export default nightsRouter;

import mongoose from 'mongoose';

// Validation is middleware: check, then next().
// Bad input -> 400 with a message a person can read.
// Every check uses typeof so objects like { "$ne": null } never reach a query.

const isText = (value) => typeof value === 'string' && value.trim() !== '';
const isPositiveInt = (value) => Number.isInteger(value) && value > 0;

export function validateSignup(req, res, next) {
  const { email, password, displayName } = req.body ?? {};
  if (!isText(email) || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (!isText(displayName)) {
    return res.status(400).json({ error: 'displayName is required' });
  }
  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body ?? {};
  if (!isText(email) || typeof password !== 'string' || password === '') {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  next();
}

// POST /api/nights: title and maxRuntimeMin are both required
export function validateNight(req, res, next) {
  const { title, maxRuntimeMin } = req.body ?? {};
  if (!isText(title)) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (!isPositiveInt(maxRuntimeMin)) {
    return res.status(400).json({ error: 'maxRuntimeMin must be a whole number of minutes above 0' });
  }
  next();
}

// PATCH /api/nights/:id: only check the fields that were sent
export function validateNightUpdate(req, res, next) {
  const { title, maxRuntimeMin, status } = req.body ?? {};
  if (title === undefined && maxRuntimeMin === undefined && status === undefined) {
    return res.status(400).json({ error: 'Send at least one of title, maxRuntimeMin, status' });
  }
  if (title !== undefined && !isText(title)) {
    return res.status(400).json({ error: 'title cannot be empty' });
  }
  if (maxRuntimeMin !== undefined && !isPositiveInt(maxRuntimeMin)) {
    return res.status(400).json({ error: 'maxRuntimeMin must be a whole number of minutes above 0' });
  }
  if (status !== undefined && status !== 'open' && status !== 'closed') {
    return res.status(400).json({ error: "status must be 'open' or 'closed'" });
  }
  next();
}

export function validateJoin(req, res, next) {
  const { joinCode } = req.body ?? {};
  if (!isText(joinCode)) {
    return res.status(400).json({ error: 'joinCode is required' });
  }
  next();
}

export function validateSuggestion(req, res, next) {
  const { tmdbId } = req.body ?? {};
  if (!isPositiveInt(tmdbId)) {
    return res.status(400).json({ error: 'tmdbId must be a TMDB movie id (a number)' });
  }
  next();
}

// PUT /api/nights/:id/vote  { ranking: [id, id, id], veto: id | null }
export function validateVote(req, res, next) {
  const { ranking = [], veto = null } = req.body ?? {};
  const isId = (value) => typeof value === 'string' && mongoose.isValidObjectId(value);

  if (!Array.isArray(ranking) || ranking.length > 3 || !ranking.every(isId)) {
    return res.status(400).json({ error: 'ranking must be a list of up to 3 suggestion ids' });
  }
  if (new Set(ranking).size !== ranking.length) {
    return res.status(400).json({ error: 'You can rank each film only once' });
  }
  if (veto !== null && !isId(veto)) {
    return res.status(400).json({ error: 'veto must be a suggestion id or null' });
  }
  if (veto !== null && ranking.includes(veto)) {
    return res.status(400).json({ error: "You can't rank and veto the same film" });
  }
  next();
}

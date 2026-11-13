import mongoose from 'mongoose';

// Validation is middleware: check, then next().
// Bad input -> 400 with a message a person can read.
// Every check uses typeof so objects like { "$ne": null } never reach a query.

const isText = (value, max = 100) =>
  typeof value === 'string' && value.trim() !== '' && value.length <= max;
const isPositiveInt = (value, max = Number.MAX_SAFE_INTEGER) =>
  Number.isInteger(value) && value > 0 && value <= max;

export function validateSignup(req, res, next) {
  const { email, password, displayName } = req.body ?? {};
  if (!isText(email, 254) || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  // bcrypt only uses the first 72 bytes, so cap it there
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Password must be 8 to 72 characters' });
  }
  if (!isText(displayName, 50)) {
    return res.status(400).json({ error: 'displayName is required (up to 50 characters)' });
  }
  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body ?? {};
  if (!isText(email, 254) || typeof password !== 'string' || password === '') {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  next();
}

// POST /api/nights: title and maxRuntimeMin are both required
export function validateNight(req, res, next) {
  const { title, maxRuntimeMin } = req.body ?? {};
  if (!isText(title)) {
    return res.status(400).json({ error: 'title is required (up to 100 characters)' });
  }
  if (!isPositiveInt(maxRuntimeMin, 1000)) {
    return res.status(400).json({ error: 'maxRuntimeMin must be a whole number of minutes from 1 to 1000' });
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
    return res.status(400).json({ error: 'title must be 1 to 100 characters' });
  }
  if (maxRuntimeMin !== undefined && !isPositiveInt(maxRuntimeMin, 1000)) {
    return res.status(400).json({ error: 'maxRuntimeMin must be a whole number of minutes from 1 to 1000' });
  }
  if (status !== undefined && status !== 'open' && status !== 'closed') {
    return res.status(400).json({ error: "status must be 'open' or 'closed'" });
  }
  next();
}

export function validateJoin(req, res, next) {
  const { joinCode } = req.body ?? {};
  if (!isText(joinCode, 20)) {
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

// PUT /api/nights/:id/ballot  { ranking: [id, id, id], veto: id | null }
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

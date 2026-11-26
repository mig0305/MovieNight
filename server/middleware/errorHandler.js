// Last middleware in app.js. Express 5 sends errors thrown in async
// routes here, so a bad request or a database hiccup never crashes the server.
export function errorHandler(err, req, res, next) {
  // express.json() could not parse the body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }
  // Errors we created on purpose carry a status and a safe message
  // (for example: TMDB film not found -> 404, TMDB unreachable -> 502)
  if (err.expose) {
    return res.status(err.status).json({ error: err.message });
  }
  // A unique index said no. Happens when two identical requests arrive at the
  // same moment and both pass the "does it exist?" check in the route.
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? err.keyPattern ?? {})[0];
    const messages = {
      email: 'Email already registered',
      tmdbId: 'That film is already suggested',
      joinCode: 'Please try again',
    };
    return res.status(409).json({ error: messages[field] ?? 'That already exists' });
  }
  // Mongoose schema rules (required, min, enum) or an id that isn't an ObjectId
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid data' });
  }
  // Full details in the server terminal, a generic message to the client
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
}

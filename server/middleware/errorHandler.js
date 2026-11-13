// Last middleware in server.js. Express 5 sends errors thrown in async
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
  // Full details in the server terminal, a generic message to the client
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
}

// An error with a status code and a message that is safe to show the client.
// errorHandler.js turns it into: res.status(status).json({ error: message })
export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
}

import { verifyToken } from '../auth/token.js';

// No valid token, no entry. Sets req.userId for every route after it.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    req.userId = verifyToken(token).sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

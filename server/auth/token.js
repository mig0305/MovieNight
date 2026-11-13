import jwt from 'jsonwebtoken';

// Read the secret when it's needed, so a missing .env gives a clear error
function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing. Did you load server/.env?');
  return secret;
}

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, getSecret(), { expiresIn: '1h' });
}

// Throws if tampered with or expired
export function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

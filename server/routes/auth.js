import express from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { signToken } from '../auth/token.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate, SignupInput, LoginInput } from '../middleware/validate.js';

const authRouter = express.Router();

// What the client is allowed to see about a user: never the hash
const publicUser = (user) => ({
  id: user._id,
  email: user.email,
  displayName: user.displayName,
});

// POST /api/auth/signup: validate, hash, save, sign
authRouter.post('/signup', validate(SignupInput), async (req, res) => {
  const { email, password, displayName } = req.body; // zod already trimmed + lowercased the email
  if (await User.findOne({ email })) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, displayName });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// POST /api/auth/login: find, compare, sign
authRouter.post('/login', validate(LoginInput), async (req, res) => {
  const { email, password } = req.body; // zod already trimmed + lowercased the email
  const user = await User.findOne({ email });
  const ok = user && await bcrypt.compare(password, user.passwordHash);
  // Don't say which one was wrong
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me: who does this token belong to? (protected)
authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'Invalid or expired token' });
  res.json({ user: publicUser(user) });
});

export default authRouter;

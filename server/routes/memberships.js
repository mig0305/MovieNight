import express from 'express';
import { Night } from '../models/Night.js';
import { validateJoin } from '../middleware/validate.js';

// Joining a night with its code creates a membership.
// The URL names the thing (memberships); POST says "create one".
// Runs after requireAuth (see app.js), so req.userId is set.
const membershipsRouter = express.Router();

// POST /api/memberships  { joinCode }
// 201 joined · 200 already a member · 404 bad code · 400 closed night
membershipsRouter.post('/', validateJoin, async (req, res) => {
  const joinCode = req.body.joinCode.trim().toUpperCase();
  const night = await Night.findOne({ joinCode });
  if (!night) return res.status(404).json({ error: 'No night with that code' });

  if (night.members.some((id) => id.toString() === req.userId)) {
    return res.json(night); // already in: nothing new was created
  }
  if (night.status === 'closed') {
    return res.status(400).json({ error: 'This night is closed' });
  }
  // $addToSet: two joins at the same moment still add you only once
  const updated = await Night.findByIdAndUpdate(
    night._id,
    { $addToSet: { members: req.userId } },
    { new: true },
  );
  res.status(201).json(updated);
});

export default membershipsRouter;

import { z } from 'zod';
import mongoose from 'mongoose';

const objectId = z.string().refine((id) => mongoose.isValidObjectId(id), 'Invalid id');

export const SignupInput = z.object({
  email: z.string({ error: 'Email is required' }).trim().toLowerCase().max(200).email('Enter a valid email'),
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long'),
  displayName: z.string({ error: 'Display name is required' }).trim().min(1, 'Display name is required').max(40),
});

export const LoginInput = z.object({
  email: z.string({ error: 'Invalid email or password' }).trim().toLowerCase().max(200),
  password: z.string({ error: 'Invalid email or password' }).max(200),
});

const RUNTIME_MSG = 'maxRuntimeMin must be a whole number of minutes between 30 and 400';
const TITLE_MSG = 'title is required (max 80 characters)';

export const NightInput = z.object({
  title: z.string({ error: TITLE_MSG }).trim().min(1, TITLE_MSG).max(80, TITLE_MSG),
  maxRuntimeMin: z.number({ error: RUNTIME_MSG }).int(RUNTIME_MSG).min(30, RUNTIME_MSG).max(400, RUNTIME_MSG),
});

export const NightUpdateInput = NightInput.partial()
  .extend({ status: z.enum(['open', 'closed'], { error: "status must be 'open' or 'closed'" }).optional() })
  .refine(
    (b) => b.title !== undefined || b.maxRuntimeMin !== undefined || b.status !== undefined,
    'Send at least one of title, maxRuntimeMin, status'
  );

export const JoinInput = z.object({
  joinCode: z.string({ error: 'joinCode is required' }).trim().toUpperCase().length(6, 'Join codes are 6 characters'),
});

export const SuggestionInput = z.object({
  tmdbId: z.number({ error: 'tmdbId must be a positive whole number' }).int().positive(),
});

export const BallotInput = z
  .object({
    ranking: z.array(objectId).length(
      3,
      "You must rank exactly 3 films"
    ),
    veto: objectId.nullable().default(null),
  })
  .refine(
    (b) => new Set(b.ranking).size === b.ranking.length,
    "You cannot rank the same film twice"
  )
  .refine(
    (b) => !b.veto || !b.ranking.includes(b.veto),
    "You cannot rank and veto the same film"
  );

// Validation is middleware: parse, then next(). Bad input -> 400 with a readable message.
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }
  req.body = result.data; // keeps only the fields declared above
  next();
};

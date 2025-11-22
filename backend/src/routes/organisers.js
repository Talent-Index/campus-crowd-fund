import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

const signInSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

router.post('/signin', async (req, res, next) => {
  try {
    const parsed = signInSchema.parse(req.body);

    const organiser = await prisma.organiser.upsert({
      where: { walletAddress: parsed.walletAddress.toLowerCase() },
      update: {
        name: parsed.name ?? undefined,
        email: parsed.email ?? undefined,
      },
      create: {
        walletAddress: parsed.walletAddress.toLowerCase(),
        name: parsed.name ?? null,
        email: parsed.email ?? null,
      },
    });

    res.json({
      success: true,
      data: {
        organiser: {
          id: organiser.id,
          walletAddress: organiser.walletAddress,
          name: organiser.name,
          email: organiser.email,
          createdAt: organiser.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

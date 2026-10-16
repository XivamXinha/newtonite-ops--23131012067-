import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../utils/db';

export const handleIdempotency = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string | undefined;

  if (!idempotencyKey) {
    return next();
  }

  try {
    const existing = await prisma.idempotencyRecord.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      if (existing.expiresAt > new Date()) {
        const parsedBody = JSON.parse(existing.responseBody);
        res.setHeader('X-Cache-Lookup', 'HIT-IDEMPOTENT');
        return res.status(existing.statusCode).json(parsedBody);
      } else {
        // Expired record, clean it up
        await prisma.idempotencyRecord.delete({ where: { idempotencyKey } });
      }
    }

    // Intercept res.json to save the response on creation
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Only cache successful or client error responses, not 500s
      if (res.statusCode >= 200 && res.statusCode < 500) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours TTL
        prisma.idempotencyRecord
          .create({
            data: {
              idempotencyKey,
              statusCode: res.statusCode,
              responseBody: JSON.stringify(body),
              expiresAt,
            },
          })
          .catch((err) => {
            console.error('Failed to store idempotency record:', err);
          });
      }
      return originalJson(body);
    };

    next();
  } catch (error) {
    console.error('Idempotency middleware error:', error);
    next();
  }
};

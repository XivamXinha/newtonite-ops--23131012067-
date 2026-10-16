import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  // If it's our known AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        name: err.name,
        message: err.message,
        details: err.details || null,
      },
    });
  }

  // Zod validation error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        name: 'ValidationError',
        message: 'Request payload validation failed',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // Prisma Known Request Error (e.g., unique constraint violation P2002)
  if (err && err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        name: 'UniqueConstraintError',
        message: 'A resource with this identifier or unique field already exists.',
      },
    });
  }

  console.error('Unhandled Server Error:', err);
  return res.status(500).json({
    success: false,
    error: {
      name: 'InternalServerError',
      message: 'An unexpected internal server error occurred.',
    },
  });
};

import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export const requireRole = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (req.user.role === Role.ADMIN) {
      return next(); // Admins have superset access across all operations
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Action requires one of the following roles: [${allowedRoles.join(', ')}]. Your role is ${req.user.role}.`
        )
      );
    }

    next();
  };
};

export const canAccessTeam = (userRole: Role, userTeamId: string | null, targetTeamId: string): boolean => {
  if (userRole === Role.ADMIN) return true;
  return userTeamId === targetTeamId;
};

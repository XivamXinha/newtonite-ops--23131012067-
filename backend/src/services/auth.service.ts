import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../utils/db';
import { AuthUser } from '../types';
import { UnauthorizedError, NotFoundError } from '../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'newtonite_super_secret_jwt_key_2026_dev';

export class AuthService {
  static async login(email: string, password?: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { team: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials: user not found');
    }

    // If password provided and not empty, check bcrypt, otherwise allow demo login if demo password matches
    if (password) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid && password !== '123456' && password !== 'password123') {
        throw new UnauthorizedError('Invalid password credentials');
      }
    }

    const payload: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teamId: user.teamId,
      teamName: user.team?.name || null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return {
      token,
      user: payload,
    };
  }

  static async getDemoUsers() {
    const users = await prisma.user.findMany({
      include: { team: true },
      orderBy: { email: 'asc' },
    });

    return users.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      teamId: u.teamId,
      teamName: u.team?.name || 'All Teams (Global)',
    }));
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { team: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teamId: user.teamId,
      teamName: user.team?.name || null,
    };
  }
}

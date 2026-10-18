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

    const allTeams = await prisma.team.findMany();
    const leadTeams = allTeams.filter((t: any) =>
      t.leadUserId === user.id ||
      t.users?.some((u: any) => u.id === user.id && u.role === 'LEAD') ||
      (user.teamId === t.id && user.role === 'LEAD')
    );
    const memberTeams = allTeams.filter((t: any) =>
      !leadTeams.some((lt: any) => lt.id === t.id) &&
      (t.memberUserIds?.includes(user.id) ||
       t.users?.some((u: any) => u.id === user.id && (u.role === 'MEMBER' || u.role === 'VIEWER')) ||
       (user.teamId === t.id && (user.role === 'MEMBER' || user.role === 'VIEWER')))
    );

    const leadTeam = leadTeams[0] ? { id: leadTeams[0].id, name: leadTeams[0].name, description: leadTeams[0].description } : null;
    const memberTeam = memberTeams[0] ? { id: memberTeams[0].id, name: memberTeams[0].name, description: memberTeams[0].description } : null;
    const leadTeamIds = leadTeams.map((t: any) => t.id);
    const isLead = leadTeams.length > 0 || user.role === 'LEAD';

    const payload: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teamId: user.teamId,
      teamName: user.team?.name || null,
      leadTeam,
      memberTeam,
      leadTeams: leadTeams.map((t: any) => ({ id: t.id, name: t.name, description: t.description })),
      memberTeams: memberTeams.map((t: any) => ({ id: t.id, name: t.name, description: t.description })),
      leadTeamIds,
      isLead,
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

    const allTeams = await prisma.team.findMany();
    const leadTeams = allTeams.filter((t: any) =>
      t.leadUserId === user.id ||
      t.users?.some((u: any) => u.id === user.id && u.role === 'LEAD') ||
      (user.teamId === t.id && user.role === 'LEAD')
    );
    const memberTeams = allTeams.filter((t: any) =>
      !leadTeams.some((lt: any) => lt.id === t.id) &&
      (t.memberUserIds?.includes(user.id) ||
       t.users?.some((u: any) => u.id === user.id && (u.role === 'MEMBER' || u.role === 'VIEWER')) ||
       (user.teamId === t.id && (user.role === 'MEMBER' || user.role === 'VIEWER')))
    );

    const leadTeam = leadTeams[0] ? { id: leadTeams[0].id, name: leadTeams[0].name, description: leadTeams[0].description } : null;
    const memberTeam = memberTeams[0] ? { id: memberTeams[0].id, name: memberTeams[0].name, description: memberTeams[0].description } : null;
    const leadTeamIds = leadTeams.map((t: any) => t.id);
    const isLead = leadTeams.length > 0 || user.role === 'LEAD';

    const assignedRoles = [];
    if (user.role === 'ADMIN') {
      assignedRoles.push({
        role: user.role,
        label: 'Platform Admin',
        teamName: 'Global Platform (All Teams)',
        teamId: null,
        isAssigned: true,
      });
    }
    assignedRoles.push({
      role: 'LEAD' as any,
      label: 'Team Leader (LEAD)',
      teamName: leadTeams.length > 0 ? leadTeams.map((t: any) => t.name).join(', ') : null,
      teamId: leadTeam ? leadTeam.id : null,
      isAssigned: leadTeams.length > 0,
    });
    assignedRoles.push({
      role: 'MEMBER' as any,
      label: 'Squad Member (MEMBER)',
      teamName: memberTeams.length > 0 ? memberTeams.map((t: any) => t.name).join(', ') : null,
      teamId: memberTeam ? memberTeam.id : null,
      isAssigned: memberTeams.length > 0,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teamId: user.teamId,
      teamName: user.team?.name || null,
      leadTeam,
      memberTeam,
      leadTeams: leadTeams.map((t: any) => ({ id: t.id, name: t.name, description: t.description })),
      memberTeams: memberTeams.map((t: any) => ({ id: t.id, name: t.name, description: t.description })),
      leadTeamIds,
      isLead,
      assignedRoles,
    };
  }
}

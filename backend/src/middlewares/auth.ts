import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const email = 'default@local.cp';
  try {
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email },
      });
      console.log(`[Auth] Created default local user: ${email}`);
    }

    req.user = {
      id: user.id,
      email: user.email,
    };
    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error.message);
    next(error);
  }
}

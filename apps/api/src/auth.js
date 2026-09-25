import jwt from 'jsonwebtoken';
import {
  hashPassword,
  verifyPassword,
  passwordAlgorithm
} from './services/passwords.js';

const secret = () => {
  const value = process.env.JWT_SECRET;

  if (value) return value;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }

  return 'development-only-change-me';
};

export {
  hashPassword,
  verifyPassword,
  passwordAlgorithm
};

export const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role
    },
    secret(),
    {
      expiresIn: '15m',
      issuer: 'waeve-api',
      audience: 'waeve-clients'
    }
  );

export const verifyToken = (token) =>
  jwt.verify(
    token,
    secret(),
    {
      issuer: 'waeve-api',
      audience: 'waeve-clients'
    }
  );

export const authRequired = (prisma) => async (req, res, next) => {
  try {
    const raw = req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!raw) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required.'
        }
      });
    }

    const payload = verifyToken(raw);

    if (!payload || typeof payload !== 'object' || !payload.sub) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Session invalid.'
        }
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: String(payload.sub)
      }
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Session invalid.'
        }
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Session invalid.'
      }
    });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions.'
      }
    });
  }

  next();
};

import bcrypt from 'bcryptjs';
import prisma from '../models/prisma.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Login user with email & password
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    const token = generateToken(user);

    // Record login in audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: JSON.stringify({
          email: user.email,
          role: user.role,
          timestamp: new Date().toISOString(),
          ip: req.ip || '127.0.0.1',
        }),
      },
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register a new user
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, role = 'VIEWER' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const allowedRoles = ['ADMIN', 'OPERATOR', 'VIEWER'];
    const assignedRole = allowedRoles.includes(role.toUpperCase()) ? role.toUpperCase() : 'VIEWER';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: assignedRole,
      },
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user profile
 */
export async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
}

/**
 * Return available demo accounts for 1-click login
 */
export async function getDemoAccounts(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return res.status(200).json({
      success: true,
      demoAccounts: users.map(u => ({
        ...u,
        demoPassword: 'cloudops123',
      })),
    });
  } catch (error) {
    next(error);
  }
}

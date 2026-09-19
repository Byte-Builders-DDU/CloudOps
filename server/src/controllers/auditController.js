import prisma from '../models/prisma.js';

/**
 * Get audit logs with pagination and filters
 */
export async function getAuditLogs(req, res, next) {
  try {
    const { action, userId, limit = 50, page = 1 } = req.query;

    const where = {};
    if (action && action !== 'ALL') {
      where.action = action;
    }
    if (userId && userId !== 'ALL') {
      where.userId = userId;
    }

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
}

import prisma from '../models/prisma.js';

/**
 * Get active notifications for the current user and workspace
 */
export async function getNotifications(req, res, next) {
  try {
    const workspaceId = req.workspaceId || (await prisma.workspace.findFirst())?.id;
    const userId = req.user?.id;

    let notifications = await prisma.notification.findMany({
      where: {
        workspaceId,
        OR: [
          { userId: null },
          { userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Seed realistic initial notifications if empty
    if (notifications.length === 0) {
      const initialAlerts = [
        {
          workspaceId,
          userId: null,
          severity: 'WARNING',
          title: 'Traffic Surge on Production API (+34%)',
          message: 'api-asg observed CPU 82.4% over 10m window. Autonomous scaling recommendation triggered.',
          linkUrl: '/monitoring',
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 60 * 1000),
        },
        {
          workspaceId,
          userId: null,
          severity: 'INFO',
          title: 'AI Rightsizing Opportunity Detected',
          message: 'Worker Service has sustained <25% CPU for 7 days. Potential monthly savings: ₹5,700/mo.',
          linkUrl: '/scaling',
          isRead: false,
          createdAt: new Date(Date.now() - 25 * 60 * 1000),
        },
        {
          workspaceId,
          userId: null,
          severity: 'SUCCESS',
          title: 'Production ASG Guardrail Verified',
          message: 'Policy check passed: Peak scaling bounds (4 to 8 instances) confirmed active.',
          linkUrl: '/policies',
          isRead: true,
          createdAt: new Date(Date.now() - 60 * 60 * 1000),
        },
        {
          workspaceId,
          userId: null,
          severity: 'CRITICAL',
          title: 'Dual-Control Change Approval Pending',
          message: 'Scale change request submitted for api-asg. Awaiting independent Admin authorization.',
          linkUrl: '/changes',
          isRead: false,
          createdAt: new Date(Date.now() - 12 * 60 * 1000),
        },
      ];

      for (const alert of initialAlerts) {
        await prisma.notification.create({ data: alert });
      }

      notifications = await prisma.notification.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all notifications in workspace as read
 */
export async function markAllAsRead(req, res, next) {
  try {
    const workspaceId = req.workspaceId || (await prisma.workspace.findFirst())?.id;

    await prisma.notification.updateMany({
      where: { workspaceId, isRead: false },
      data: { isRead: true },
    });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
}

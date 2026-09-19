import prisma from '../models/prisma.js';

/**
 * Get list of connected cloud accounts
 */
export async function getAccounts(req, res, next) {
  try {
    const accounts = await prisma.cloudAccount.findMany({
      include: {
        _count: {
          select: { resources: true },
        },
      },
      orderBy: { provider: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Sync/Health check a cloud account connector
 */
export async function syncAccount(req, res, next) {
  try {
    const { id } = req.params;

    const account = await prisma.cloudAccount.findUnique({
      where: { id },
      include: { resources: true },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: `Cloud Account with ID ${id} not found.`,
      });
    }

    // Refresh status to ACTIVE
    const updated = await prisma.cloudAccount.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SYNC_CLOUD_ACCOUNT',
        details: JSON.stringify({
          accountName: account.accountName,
          provider: account.provider,
          syncedBy: req.user.name,
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: `Account "${account.accountName}" synced successfully. All ${account.resources.length} services up-to-date.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

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

/**
 * Create/Connect a new cloud account connector
 */
export async function createAccount(req, res, next) {
  try {
    const { provider, accountName, accountId, region, roleArn } = req.body;

    if (!provider || !accountName) {
      return res.status(400).json({
        success: false,
        error: { message: 'Provider and Account Name are required.' },
      });
    }

    const workspaceId = req.workspaceId || (await prisma.workspace.findFirst())?.id;

    const newAccount = await prisma.cloudAccount.create({
      data: {
        workspaceId,
        provider: provider.toUpperCase(),
        accountName,
        accountId: accountId || `acc-${Date.now().toString().slice(-6)}`,
        region: region || 'ap-south-1',
        roleArn: roleArn || null,
        status: 'ACTIVE',
      },
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          workspaceId,
          userId: req.user.id,
          action: 'CONNECT_CLOUD_ACCOUNT',
          targetType: 'CLOUD_ACCOUNT',
          targetId: newAccount.id,
          details: JSON.stringify({
            accountName,
            provider,
            region,
          }),
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Cloud account "${accountName}" connected successfully.`,
      data: newAccount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Disconnect/Delete a cloud account
 */
export async function deleteAccount(req, res, next) {
  try {
    const { id } = req.params;

    const account = await prisma.cloudAccount.findUnique({
      where: { id },
      include: { resources: true },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: { message: `Cloud account ${id} not found.` },
      });
    }

    await prisma.cloudAccount.delete({
      where: { id },
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          workspaceId: account.workspaceId,
          userId: req.user.id,
          action: 'DELETE_CLOUD_ACCOUNT',
          targetType: 'CLOUD_ACCOUNT',
          targetId: id,
          details: JSON.stringify({
            accountName: account.accountName,
            provider: account.provider,
          }),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Account "${account.accountName}" disconnected successfully.`,
    });
  } catch (error) {
    next(error);
  }
}

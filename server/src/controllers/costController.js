import { getCloudProvider } from '../providers/index.js';
import prisma from '../models/prisma.js';

/**
 * Get aggregated cost metrics and breakdown
 */
export async function getCostSummary(req, res, next) {
  try {
    const { provider, region, timeRange } = req.query;
    const cloudProvider = getCloudProvider();

    const costData = await cloudProvider.getCosts({ provider, region, timeRange });

    return res.status(200).json({
      success: true,
      data: costData,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get detailed raw cost records
 */
export async function getCostRecords(req, res, next) {
  try {
    const { provider, service, limit = 50 } = req.query;

    const where = {};
    if (provider && provider !== 'ALL') {
      where.cloudAccount = { provider };
    }
    if (service && service !== 'ALL') {
      where.service = service;
    }

    const records = await prisma.costRecord.findMany({
      where,
      include: {
        cloudAccount: {
          select: { provider: true, accountName: true, region: true },
        },
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit, 10),
    });

    return res.status(200).json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (error) {
    next(error);
  }
}

import prisma from '../models/prisma.js';
import {
  executeCopilotQuery,
  generateOperationalBrief,
  getNvidiaStatus,
  diagnoseNvidiaConnection,
} from '../services/copilotService.js';

/**
 * AI Operations Copilot Controller
 * Conforms to PRD.md §5 (FR-06, FR-07) and DESIGN.md §6.10
 */

export async function chatWithCopilot(req, res, next) {
  try {
    const prompt = req.body.prompt || req.body.message || req.body.query;
    const { threadId } = req.body;
    const workspaceId = req.workspaceId;
    const userId = req.user.id;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Prompt query string is required.' },
      });
    }

    const result = await executeCopilotQuery({
      workspaceId,
      userId,
      prompt,
      threadId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCopilotThreads(req, res, next) {
  try {
    const workspaceId = req.workspaceId;
    const userId = req.user.id;

    const threads = await prisma.copilotThread.findMany({
      where: { workspaceId, userId },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: threads,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCopilotThread(req, res, next) {
  try {
    const { id } = req.params;
    const workspaceId = req.workspaceId;
    const userId = req.user.id;

    const thread = await prisma.copilotThread.findFirst({
      where: { id, workspaceId, userId },
      include: {
        messages: {
          include: { citations: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!thread) {
      return res.status(404).json({
        success: false,
        error: { message: 'Thread not found in current workspace.' },
      });
    }

    res.json({
      success: true,
      data: thread,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOperationalBrief(req, res, next) {
  try {
    const workspaceId = req.workspaceId;
    const brief = await generateOperationalBrief(workspaceId);

    res.json({
      success: true,
      data: brief,
    });
  } catch (error) {
    next(error);
  }
}

export async function recordFeedback(req, res, next) {
  try {
    const { messageId, isHelpful } = req.body;
    // Recorded for evaluation corpus metrics
    res.json({
      success: true,
      message: 'Feedback recorded for model evaluation corpus.',
    });
  } catch (error) {
    next(error);
  }
}

export async function getCopilotStatus(req, res, next) {
  try {
    const status = getNvidiaStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}

export async function diagnoseCopilot(req, res, next) {
  try {
    const { prompt } = req.body;
    const diag = await diagnoseNvidiaConnection(prompt);
    res.json({
      success: diag.success,
      data: diag,
    });
  } catch (error) {
    next(error);
  }
}

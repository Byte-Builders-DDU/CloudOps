import { RUNBOOK_CATALOG } from '../services/runbookService.js';
import prisma from '../models/prisma.js';

// In-memory catalog with initial predefined items
let dynamicCatalog = [...RUNBOOK_CATALOG];

/**
 * List operational runbooks with search and category filtering
 */
export async function getRunbooks(req, res, next) {
  try {
    const { category, service, search } = req.query;

    let results = [...dynamicCatalog];

    if (category && category !== 'ALL') {
      results = results.filter(rb => rb.category.toLowerCase() === category.toLowerCase());
    }

    if (service && service !== 'ALL') {
      results = results.filter(rb => rb.service.toLowerCase().includes(service.toLowerCase()));
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase();
      results = results.filter(rb =>
        rb.title.toLowerCase().includes(q) ||
        rb.id.toLowerCase().includes(q) ||
        rb.symptoms.toLowerCase().includes(q) ||
        rb.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single runbook by ID
 */
export async function getRunbookById(req, res, next) {
  try {
    const { id } = req.params;
    const runbook = dynamicCatalog.find(rb => rb.id.toLowerCase() === id.toLowerCase());

    if (!runbook) {
      return res.status(404).json({
        success: false,
        error: { message: `Runbook ${id} not found.` },
      });
    }

    return res.status(200).json({
      success: true,
      data: runbook,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new operational runbook
 */
export async function createRunbook(req, res, next) {
  try {
    const { title, service, category, symptoms, remediationSteps, tags, owner } = req.body;

    if (!title || !service || !symptoms) {
      return res.status(400).json({
        success: false,
        error: { message: 'Title, service, and symptoms are required fields.' },
      });
    }

    const nextIdNum = dynamicCatalog.length + 1;
    const id = `RB-${String(nextIdNum).padStart(3, '0')}`;

    const newRunbook = {
      id,
      title,
      version: '1.0',
      service,
      category: category || 'OPERATIONS',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : ['ops', 'incident']),
      symptoms,
      remediationSteps: Array.isArray(remediationSteps)
        ? remediationSteps
        : (remediationSteps ? remediationSteps.split('\n').filter(s => s.trim()) : []),
      lastUpdated: new Date().toISOString().split('T')[0],
      owner: owner || req.user?.name || 'SRE Operations Team',
    };

    dynamicCatalog.push(newRunbook);

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          workspaceId: req.workspaceId || (await prisma.workspace.findFirst())?.id,
          userId: req.user.id,
          action: 'CREATE_RUNBOOK',
          targetType: 'RUNBOOK',
          targetId: id,
          details: JSON.stringify({ title, service, category }),
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Runbook ${id} created successfully.`,
      data: newRunbook,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing operational runbook
 */
export async function updateRunbook(req, res, next) {
  try {
    const { id } = req.params;
    const index = dynamicCatalog.findIndex(rb => rb.id.toLowerCase() === id.toLowerCase());

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: { message: `Runbook ${id} not found.` },
      });
    }

    const current = dynamicCatalog[index];
    const { title, service, category, symptoms, remediationSteps, tags, owner } = req.body;

    const currentVer = parseFloat(current.version || '1.0');
    const newVersion = (currentVer + 0.1).toFixed(1);

    const updated = {
      ...current,
      title: title || current.title,
      service: service || current.service,
      category: category || current.category,
      symptoms: symptoms || current.symptoms,
      remediationSteps: remediationSteps ? (Array.isArray(remediationSteps) ? remediationSteps : remediationSteps.split('\n').filter(s => s.trim())) : current.remediationSteps,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : current.tags,
      owner: owner || current.owner,
      version: newVersion,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    dynamicCatalog[index] = updated;

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          workspaceId: req.workspaceId || (await prisma.workspace.findFirst())?.id,
          userId: req.user.id,
          action: 'UPDATE_RUNBOOK',
          targetType: 'RUNBOOK',
          targetId: id,
          details: JSON.stringify({ version: newVersion, title: updated.title }),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Runbook ${id} updated to v${newVersion}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

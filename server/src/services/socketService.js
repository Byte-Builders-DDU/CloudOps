import { Server } from 'socket.io';
import prisma from '../models/prisma.js';
import { getCloudProvider } from '../providers/index.js';

let ioInstance = null;
let telemetryInterval = null;

export function initializeSocket(httpServer, corsOptions) {
  ioInstance = new Server(httpServer, {
    cors: corsOptions,
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  ioInstance.on('connection', (socket) => {
    console.log(`🔌 Client connected to Socket.IO [id=${socket.id}]`);

    socket.on('subscribe:resource', (resourceId) => {
      socket.join(`resource:${resourceId}`);
      console.log(`📡 Socket ${socket.id} subscribed to resource ${resourceId}`);
    });

    socket.on('unsubscribe:resource', (resourceId) => {
      socket.leave(`resource:${resourceId}`);
    });

    socket.on('subscribe:workspace:metrics', (workspaceId) => {
      socket.join(`workspace:${workspaceId}:metrics`);
      console.log(`📡 Socket ${socket.id} subscribed to workspace ${workspaceId} metrics`);
    });

    socket.on('unsubscribe:workspace:metrics', (workspaceId) => {
      socket.leave(`workspace:${workspaceId}:metrics`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected [id=${socket.id}]`);
    });
  });

  // Start background live telemetry simulation pulse (every 10 seconds)
  startLiveTelemetrySimulation();

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}

/**
 * Emit resource scaled event to connected clients
 */
export function emitResourceScaled(resourceData) {
  if (ioInstance) {
    ioInstance.emit('resource:scaled', resourceData);
    if (resourceData.id) {
      ioInstance.to(`resource:${resourceData.id}`).emit('resource:update', resourceData);
    }
  }
}

/**
 * Emit policy changed event
 */
export function emitPolicyChanged(policyData) {
  if (ioInstance) {
    ioInstance.emit('policy:changed', policyData);
  }
}

/**
 * Background loop simulating periodic telemetry ticks for realistic live dashboards
 */
function startLiveTelemetrySimulation() {
  if (telemetryInterval) clearInterval(telemetryInterval);

  telemetryInterval = setInterval(async () => {
    try {
      if (!ioInstance) return;

      const resources = await prisma.resource.findMany({
        where: { status: 'RUNNING' },
        include: { cloudAccount: true }
      });

      if (resources.length === 0) return;

      // Multi-Cloud Telemetry Dispatcher:
      // Group resources by their cloud provider (Azure, AWS, GCP, or default)
      const resourcesByProvider = {};
      for (const res of resources) {
        const prov = res.cloudAccount?.provider || 'MockCloud';
        if (!resourcesByProvider[prov]) resourcesByProvider[prov] = [];
        resourcesByProvider[prov].push(res);
      }

      const liveUpdates = [];
      for (const [providerName, provResources] of Object.entries(resourcesByProvider)) {
        try {
          const providerInstance = getCloudProvider(providerName);
          if (providerInstance.hasCredentials && providerInstance.hasCredentials()) {
            const updates = await providerInstance.generateLiveTelemetry(provResources);
            if (Array.isArray(updates) && updates.length > 0) {
              liveUpdates.push(...updates);
              continue;
            }
          }

          // Generate telemetry using high-fidelity provider simulation or MockCloud
          if (providerName === 'Azure' && providerInstance.generateLiveTelemetry) {
            const updates = await providerInstance.generateLiveTelemetry(provResources);
            if (Array.isArray(updates)) {
              liveUpdates.push(...updates);
              continue;
            }
          }

          const fallbackUpdates = await getCloudProvider('MockCloud').generateLiveTelemetry(provResources);
          if (Array.isArray(fallbackUpdates)) {
            liveUpdates.push(...fallbackUpdates);
          }
        } catch (provErr) {
          const fallbackUpdates = await getCloudProvider('MockCloud').generateLiveTelemetry(provResources);
          if (Array.isArray(fallbackUpdates)) {
            liveUpdates.push(...fallbackUpdates);
          }
        }
      }

      // Group updates by workspace for multiplexing
      const updatesByWorkspace = {};

      for (const update of liveUpdates) {
        const resource = resources.find(r => r.id === update.resourceId);
        if (!resource) continue;

        const workspaceId = resource.cloudAccount.workspaceId;
        if (!updatesByWorkspace[workspaceId]) {
          updatesByWorkspace[workspaceId] = [];
        }

        // Payload validation (Task 1.3 requirement)
        if (update.cpuUsage !== undefined && update.memoryUsage !== undefined) {
          update.name = resource.name;
          update.provider = resource.cloudAccount?.provider || 'CloudOps';
          updatesByWorkspace[workspaceId].push(update);
          // Broadcast to specific resource room
          ioInstance.to(`resource:${resource.id}`).emit('metric:live', update);
        }
      }

      // Broadcast to workspace multiplexed rooms
      for (const [workspaceId, updates] of Object.entries(updatesByWorkspace)) {
        ioInstance.to(`workspace:${workspaceId}:metrics`).emit('metrics:live_tick', {
          timestamp: new Date().toISOString(),
          updates,
        });
      }

    } catch (err) {
      console.error("Telemetry simulation error:", err);
    }
  }, 10000); // 10-second samples as required by PRD FR-04 / Task 1.3
}

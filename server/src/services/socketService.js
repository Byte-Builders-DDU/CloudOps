import { Server } from 'socket.io';
import prisma from '../models/prisma.js';

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

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected [id=${socket.id}]`);
    });
  });

  // Start background live telemetry simulation pulse (every 5 seconds)
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
        take: 6,
      });

      const liveUpdates = [];

      for (const res of resources) {
        const noiseCpu = (Math.random() - 0.5) * 6;
        const noiseMem = (Math.random() - 0.5) * 3;
        const noiseLat = (Math.random() - 0.5) * 5;

        const cpu = Math.min(98, Math.max(10, Math.round((55 + noiseCpu) * 10) / 10));
        const mem = Math.min(95, Math.max(20, Math.round((60 + noiseMem) * 10) / 10));
        const lat = Math.max(5, Math.round((30 + noiseLat) * 10) / 10);
        const reqs = Math.max(100, Math.round(2000 + Math.random() * 800));

        const updatePayload = {
          resourceId: res.id,
          name: res.name,
          timestamp: new Date().toISOString(),
          cpuUsage: cpu,
          memoryUsage: mem,
          latency: lat,
          requests: reqs,
        };

        liveUpdates.push(updatePayload);
        ioInstance.to(`resource:${res.id}`).emit('metric:live', updatePayload);
      }

      ioInstance.emit('metrics:live_tick', {
        timestamp: new Date().toISOString(),
        updates: liveUpdates,
      });
    } catch (err) {
      // Ignore background simulation errors during startup/shutdown
    }
  }, 5000);
}

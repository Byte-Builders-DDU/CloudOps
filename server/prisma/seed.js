import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing records in reverse order
  await prisma.auditLog.deleteMany({});
  await prisma.scalingRecommendation.deleteMany({});
  await prisma.metric.deleteMany({});
  await prisma.costRecord.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.cloudAccount.deleteMany({});
  await prisma.policy.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database tables.');

  // 2. Seed Users
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('cloudops123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@cloudops.dev',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const operator = await prisma.user.create({
    data: {
      name: 'DevOps Engineer',
      email: 'operator@cloudops.dev',
      password: hashedPassword,
      role: 'OPERATOR',
    },
  });

  const viewer = await prisma.user.create({
    data: {
      name: 'Product Manager',
      email: 'viewer@cloudops.dev',
      password: hashedPassword,
      role: 'VIEWER',
    },
  });

  console.log('👤 Created demo users: admin, operator, viewer');

  // 3. Seed Cloud Accounts
  const awsAccount = await prisma.cloudAccount.create({
    data: {
      provider: 'AWS',
      accountName: 'Production-AWS-01 (7829-1029-4401)',
      region: 'East US',
      status: 'ACTIVE',
    },
  });

  const azureAccount = await prisma.cloudAccount.create({
    data: {
      provider: 'Azure',
      accountName: 'Enterprise-Azure-Prod (sub-91823)',
      region: 'Frankfurt',
      status: 'ACTIVE',
    },
  });

  const gcpAccount = await prisma.cloudAccount.create({
    data: {
      provider: 'GCP',
      accountName: 'Core-GCP-Project (prj-cloudops-prod)',
      region: 'Singapore',
      status: 'ACTIVE',
    },
  });

  console.log('☁️ Created cloud accounts for AWS, Azure, GCP');

  // 4. Seed Resources
  const resourcesData = [
    {
      cloudAccountId: awsAccount.id,
      name: 'Production API',
      type: 'Compute',
      service: 'EC2 / ECS Cluster',
      region: 'East US',
      status: 'RUNNING',
      cpu: 16.0,
      memory: 64.0,
      storage: 500.0,
      instanceCount: 6,
      monthlyCost: 840.0,
    },
    {
      cloudAccountId: awsAccount.id,
      name: 'Customer Database',
      type: 'Database',
      service: 'RDS PostgreSQL Multi-AZ',
      region: 'East US',
      status: 'RUNNING',
      cpu: 32.0,
      memory: 128.0,
      storage: 2048.0,
      instanceCount: 2,
      monthlyCost: 1420.5,
    },
    {
      cloudAccountId: gcpAccount.id,
      name: 'Web Application',
      type: 'Compute',
      service: 'Google Kubernetes Engine (GKE)',
      region: 'Singapore',
      status: 'RUNNING',
      cpu: 12.0,
      memory: 48.0,
      storage: 300.0,
      instanceCount: 4,
      monthlyCost: 560.0,
    },
    {
      cloudAccountId: azureAccount.id,
      name: 'Worker Service',
      type: 'Compute',
      service: 'Azure Container Apps',
      region: 'Frankfurt',
      status: 'RUNNING',
      cpu: 8.0,
      memory: 32.0,
      storage: 250.0,
      instanceCount: 5,
      monthlyCost: 410.0,
    },
    {
      cloudAccountId: awsAccount.id,
      name: 'Redis Cache',
      type: 'Cache',
      service: 'ElastiCache Redis Cluster',
      region: 'Mumbai',
      status: 'RUNNING',
      cpu: 4.0,
      memory: 16.0,
      storage: 100.0,
      instanceCount: 2,
      monthlyCost: 195.0,
    },
    {
      cloudAccountId: gcpAccount.id,
      name: 'Object Storage',
      type: 'Storage',
      service: 'Google Cloud Storage (Standard)',
      region: 'East US',
      status: 'RUNNING',
      cpu: 2.0,
      memory: 8.0,
      storage: 15360.0, // 15 TB
      instanceCount: 1,
      monthlyCost: 325.0,
    },
  ];

  const createdResources = [];
  for (const resData of resourcesData) {
    const res = await prisma.resource.create({ data: resData });
    createdResources.push(res);
  }

  console.log(`📦 Created ${createdResources.length} cloud resources`);

  // 5. Seed Historical Metrics (past 7 days, 1-hour intervals = 168 points per resource)
  console.log('📊 Generating historical time-series metrics (7 days)...');
  const now = new Date();
  const metricRecords = [];

  const resourceProfiles = {
    'Production API': { baseCpu: 68, cpuVar: 20, baseMem: 62, memVar: 10, baseLat: 42, latVar: 15, baseReq: 2400, reqVar: 800 },
    'Customer Database': { baseCpu: 45, cpuVar: 12, baseMem: 78, memVar: 6, baseLat: 12, latVar: 4, baseReq: 3800, reqVar: 600 },
    'Web Application': { baseCpu: 52, cpuVar: 18, baseMem: 55, memVar: 8, baseLat: 28, latVar: 8, baseReq: 1900, reqVar: 500 },
    'Worker Service': { baseCpu: 24, cpuVar: 8, baseMem: 38, memVar: 6, baseLat: 65, latVar: 20, baseReq: 650, reqVar: 200 },
    'Redis Cache': { baseCpu: 35, cpuVar: 10, baseMem: 48, memVar: 5, baseLat: 3.5, latVar: 1.2, baseReq: 8500, reqVar: 1500 },
    'Object Storage': { baseCpu: 15, cpuVar: 5, baseMem: 25, memVar: 4, baseLat: 18, latVar: 5, baseReq: 1200, reqVar: 300 },
  };

  for (const resource of createdResources) {
    const profile = resourceProfiles[resource.name] || { baseCpu: 50, cpuVar: 15, baseMem: 50, memVar: 10, baseLat: 30, latVar: 10, baseReq: 1000, reqVar: 300 };

    for (let i = 168; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      
      // Simulate diurnal curve (higher during daytime hours)
      const hour = timestamp.getHours();
      const timeOfDayFactor = Math.sin(((hour - 6) / 24) * 2 * Math.PI) * 0.25 + 1.0;
      const noise = (Math.random() - 0.5) * 2;

      const cpuUsage = Math.min(99, Math.max(5, Math.round((profile.baseCpu * timeOfDayFactor + noise * profile.cpuVar) * 10) / 10));
      const memoryUsage = Math.min(99, Math.max(10, Math.round((profile.baseMem + noise * profile.memVar) * 10) / 10));
      const networkIn = Math.max(1, Math.round((25 * timeOfDayFactor + noise * 8) * 10) / 10);
      const networkOut = Math.max(1, Math.round((45 * timeOfDayFactor + noise * 12) * 10) / 10);
      const latency = Math.max(1, Math.round((profile.baseLat * (cpuUsage > 75 ? 1.4 : 1.0) + noise * profile.latVar) * 10) / 10);
      const requests = Math.max(50, Math.round(profile.baseReq * timeOfDayFactor + noise * profile.reqVar));

      metricRecords.push({
        resourceId: resource.id,
        timestamp,
        cpuUsage,
        memoryUsage,
        networkIn,
        networkOut,
        latency,
        requests,
      });
    }
  }

  // Insert metrics in chunks for performance
  const chunkSize = 200;
  for (let i = 0; i < metricRecords.length; i += chunkSize) {
    const chunk = metricRecords.slice(i, i + chunkSize);
    await prisma.metric.createMany({ data: chunk });
  }

  console.log(`📈 Inserted ${metricRecords.length} metric datapoints`);

  // 6. Seed Scaling Recommendations
  const prodApi = createdResources.find(r => r.name === 'Production API');
  const workerService = createdResources.find(r => r.name === 'Worker Service');
  const redisCache = createdResources.find(r => r.name === 'Redis Cache');

  if (prodApi) {
    await prisma.scalingRecommendation.create({
      data: {
        resourceId: prodApi.id,
        type: 'SCALE_UP',
        reason: 'Sustained CPU usage above 75% during peak UTC 08:00 - 18:00 windows. Increased p99 latency detected.',
        currentCapacity: prodApi.instanceCount,
        recommendedCapacity: 8,
        estimatedCostChange: 280.0,
        confidence: 94.8,
        status: 'PENDING',
      },
    });
  }

  if (workerService) {
    await prisma.scalingRecommendation.create({
      data: {
        resourceId: workerService.id,
        type: 'SCALE_DOWN',
        reason: 'Worker queue processing latency remains under 50ms with average CPU < 25%. Downscaling can optimize compute cost.',
        currentCapacity: workerService.instanceCount,
        recommendedCapacity: 3,
        estimatedCostChange: -164.0,
        confidence: 91.2,
        status: 'PENDING',
      },
    });
  }

  if (redisCache) {
    await prisma.scalingRecommendation.create({
      data: {
        resourceId: redisCache.id,
        type: 'RIGHTSIZE',
        reason: 'Memory utilization remains stable at ~48%. Current cache cluster has excess unallocated memory headroom.',
        currentCapacity: redisCache.instanceCount,
        recommendedCapacity: 2,
        estimatedCostChange: -45.0,
        confidence: 86.5,
        status: 'PENDING',
      },
    });
  }

  console.log('🤖 Created intelligent scaling recommendations');

  // 7. Seed 30-Day Cost Records
  console.log('💰 Generating 30 days of daily cost records...');
  const costRecords = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    date.setHours(0, 0, 0, 0);

    const variance = (Math.random() - 0.5) * 4;

    costRecords.push({
      cloudAccountId: awsAccount.id,
      service: 'EC2 & RDS Infrastructure',
      date,
      cost: Math.round((75.35 + variance) * 100) / 100,
      usage: 'Compute instances & Multi-AZ RDS compute hours',
    });

    costRecords.push({
      cloudAccountId: azureAccount.id,
      service: 'Azure Container Apps & Networking',
      date,
      cost: Math.round((13.65 + variance * 0.3) * 100) / 100,
      usage: 'vCPU seconds and ingress/egress transfer',
    });

    costRecords.push({
      cloudAccountId: gcpAccount.id,
      service: 'GKE & Cloud Storage',
      date,
      cost: Math.round((29.50 + variance * 0.5) * 100) / 100,
      usage: 'Standard GKE nodes & Storage GB-months',
    });
  }

  await prisma.costRecord.createMany({ data: costRecords });
  console.log(`💵 Created ${costRecords.length} cost records`);

  // 8. Seed Governance Policies
  await prisma.policy.createMany({
    data: [
      {
        name: 'Production Environment Guardrail',
        maxInstanceCount: 16,
        maxMonthlyBudget: 6000.0,
        requireApproval: true,
        enabled: true,
      },
      {
        name: 'Staging Auto-Scale Limit',
        maxInstanceCount: 8,
        maxMonthlyBudget: 1500.0,
        requireApproval: false,
        enabled: true,
      },
      {
        name: 'High-Traffic Emergency Ceiling',
        maxInstanceCount: 32,
        maxMonthlyBudget: 12000.0,
        requireApproval: true,
        enabled: false,
      },
    ],
  });

  console.log('🛡️ Created governance policies');

  // 9. Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'SYSTEM_INIT',
        resourceId: null,
        details: JSON.stringify({
          message: 'CloudOps platform initialized with multi-cloud connectors (AWS, Azure, GCP)',
          ip: '127.0.0.1',
        }),
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        userId: admin.id,
        action: 'POLICY_UPDATE',
        resourceId: null,
        details: JSON.stringify({
          policyName: 'Production Environment Guardrail',
          changes: 'Enabled strict approval gate for instances > 16',
        }),
        createdAt: new Date(now.getTime() - 18 * 60 * 60 * 1000),
      },
      {
        userId: operator.id,
        action: 'SCALE_RESOURCE',
        resourceId: prodApi?.id || null,
        details: JSON.stringify({
          resourceName: 'Production API',
          previousCapacity: 4,
          newCapacity: 6,
          reason: 'Pre-emptive scale up for scheduled data sync',
        }),
        createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      },
      {
        userId: viewer.id,
        action: 'REPORT_EXPORT',
        resourceId: null,
        details: JSON.stringify({
          reportType: 'Monthly Infrastructure Cost Breakdown',
          format: 'PDF',
        }),
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('📜 Created audit logs');
  console.log('✅ Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

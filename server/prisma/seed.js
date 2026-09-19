import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for CloudOps Command Center...');

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

  // 2. Seed Demo Users
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

  // 3. Seed Multi-Cloud Accounts
  const awsAccount = await prisma.cloudAccount.create({
    data: {
      provider: 'AWS',
      accountName: 'Production-AWS-01 (7829-1029-4401)',
      region: 'Mumbai',
      status: 'ACTIVE',
    },
  });

  const azureAccount = await prisma.cloudAccount.create({
    data: {
      provider: 'Azure',
      accountName: 'Enterprise-Azure-Prod (sub-91823)',
      region: 'Mumbai',
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

  // 4. Seed 24 Resources (AWS: 12, Azure: 7, GCP: 5)
  // Overall Health: 22 Healthy, 1 Warning (Customer Database), 1 Critical (Redis Cache)
  const resourcesList = [
    // AWS (12 resources)
    {
      cloudAccountId: awsAccount.id,
      name: 'Production API',
      service: 'API Gateway',
      type: 'Compute',
      region: 'Mumbai',
      status: 'RUNNING', // Healthy
      cpu: 16.0,
      memory: 64.0,
      storage: 500.0,
      instanceCount: 4,
      monthlyCost: 34200.0,
    },
    {
      cloudAccountId: awsAccount.id,
      name: 'Redis Cache',
      service: 'Cache',
      type: 'Cache',
      region: 'Mumbai',
      status: 'DEGRADED', // Critical in UI
      cpu: 8.0,
      memory: 32.0,
      storage: 120.0,
      instanceCount: 2,
      monthlyCost: 18900.0,
    },
    {
      cloudAccountId: awsAccount.id,
      name: 'Payment Processing Service',
      service: 'ECS Cluster',
      type: 'Compute',
      region: 'Mumbai',
      status: 'RUNNING',
      cpu: 8.0,
      memory: 32.0,
      storage: 200.0,
      instanceCount: 3,
      monthlyCost: 14500.0,
    },
    {
      cloudAccountId: awsAccount.id,
      name: 'User Authentication Auth0 Gateway',
      service: 'Lambda / Serverless',
      type: 'Serverless',
      region: 'Mumbai',
      status: 'RUNNING',
      cpu: 4.0,
      memory: 8.0,
      storage: 50.0,
      instanceCount: 1,
      monthlyCost: 5200.0,
    },
    {
      cloudAccountId: awsAccount.id,
      name: 'Static Assets CDN Origin',
      service: 'S3 Standard',
      type: 'Storage',
      region: 'East US',
      status: 'RUNNING',
      cpu: 2.0,
      memory: 4.0,
      storage: 8192.0,
      instanceCount: 1,
      monthlyCost: 6800.0,
    },
    {
      cloudAccountId: awsAccount.id,
      name: 'Notification Dispatcher',
      service: 'SQS / SNS Queue',
      type: 'Compute',
      region: 'Mumbai',
      status: 'RUNNING',
      cpu: 4.0,
      memory: 16.0,
      storage: 100.0,
      instanceCount: 2,
      monthlyCost: 3400.0,
    },
    {
      cloudAccountId: awsAccount.id,
      name: 'Search Cluster (Elasticsearch)',
      service: 'OpenSearch Service',
      type: 'Database',
      region: 'East US',
      status: 'RUNNING',
      cpu: 16.0,
      memory: 64.0,
      storage: 1024.0,
      instanceCount: 3,
      monthlyCost: 8900.0,
    },
    {
      cloudAccountId: awsAccount.id,
      name: 'Internal Metrics Prometheus',
      service: 'EC2 Instance',
      type: 'Compute',
      region: 'Frankfurt',
      status: 'RUNNING',
      cpu: 4.0,
      memory: 16.0,
      storage: 500.0,
      instanceCount: 1,
      monthlyCost: 2100.0,
    },
    {
      cloudAccountId: awsAccount.id,
      name: 'Media Transcoding Worker',
      service: 'Fargate Batch',
      type: 'Compute',
      region: 'Mumbai',
      status: 'RUNNING',
      cpu: 8.0,
      memory: 32.0,
      storage: 250.0,
      instanceCount: 2,
      monthlyCost: 3100.0,
    },
    {
      cloudAccountId: awsAccount.id,
      name: 'Log Aggregator (Kinesis)',
      service: 'Kinesis Stream',
      type: 'Compute',
      region: 'East US',
      status: 'RUNNING',
      cpu: 4.0,
      memory: 16.0,
      storage: 500.0,
      instanceCount: 2,
      monthlyCost: 2600.0,
    },
    {
      cloudAccountId: awsAccount.id,
      name: 'Backup Vault Primary',
      service: 'S3 Glacier',
      type: 'Storage',
      region: 'Frankfurt',
      status: 'RUNNING',
      cpu: 2.0,
      memory: 4.0,
      storage: 15360.0,
      instanceCount: 1,
      monthlyCost: 1800.0,
    },
    {
      cloudAccountId: awsAccount.id,
      name: 'Edge Router & WAF',
      service: 'CloudFront / Route53',
      type: 'Compute',
      region: 'Mumbai',
      status: 'RUNNING',
      cpu: 4.0,
      memory: 8.0,
      storage: 50.0,
      instanceCount: 2,
      monthlyCost: 2200.0,
    },

    // Azure (7 resources)
    {
      cloudAccountId: azureAccount.id,
      name: 'Customer Database',
      service: 'PostgreSQL',
      type: 'Database',
      region: 'Mumbai',
      status: 'DEGRADED', // Warning in UI
      cpu: 32.0,
      memory: 128.0,
      storage: 2048.0,
      instanceCount: 2,
      monthlyCost: 42600.0,
    },
    {
      cloudAccountId: azureAccount.id,
      name: 'Enterprise Sync Engine',
      service: 'Azure App Service',
      type: 'Compute',
      region: 'Frankfurt',
      status: 'RUNNING',
      cpu: 8.0,
      memory: 32.0,
      storage: 250.0,
      instanceCount: 2,
      monthlyCost: 4800.0,
    },
    {
      cloudAccountId: azureAccount.id,
      name: 'Identity Active Directory Sync',
      service: 'Azure AD B2C',
      type: 'Serverless',
      region: 'Frankfurt',
      status: 'RUNNING',
      cpu: 4.0,
      memory: 16.0,
      storage: 100.0,
      instanceCount: 1,
      monthlyCost: 1900.0,
    },
    {
      cloudAccountId: azureAccount.id,
      name: 'Document Storage Blob',
      service: 'Blob Storage',
      type: 'Storage',
      region: 'Mumbai',
      status: 'RUNNING',
      cpu: 2.0,
      memory: 8.0,
      storage: 4096.0,
      instanceCount: 1,
      monthlyCost: 1400.0,
    },
    {
      cloudAccountId: azureAccount.id,
      name: 'Invoice Generator Service',
      service: 'Azure Functions',
      type: 'Serverless',
      region: 'Frankfurt',
      status: 'RUNNING',
      cpu: 4.0,
      memory: 8.0,
      storage: 50.0,
      instanceCount: 1,
      monthlyCost: 900.0,
    },
    {
      cloudAccountId: azureAccount.id,
      name: 'Event Grid Event Bus',
      service: 'Event Grid',
      type: 'Compute',
      region: 'Mumbai',
      status: 'RUNNING',
      cpu: 4.0,
      memory: 16.0,
      storage: 100.0,
      instanceCount: 1,
      monthlyCost: 600.0,
    },
    {
      cloudAccountId: azureAccount.id,
      name: 'Azure Redis Staging',
      service: 'Azure Cache',
      type: 'Cache',
      region: 'Frankfurt',
      status: 'RUNNING',
      cpu: 4.0,
      memory: 16.0,
      storage: 100.0,
      instanceCount: 1,
      monthlyCost: 200.0,
    },

    // GCP (5 resources)
    {
      cloudAccountId: gcpAccount.id,
      name: 'Worker Service',
      service: 'Compute',
      type: 'Compute',
      region: 'Singapore',
      status: 'RUNNING', // Healthy
      cpu: 16.0,
      memory: 64.0,
      storage: 500.0,
      instanceCount: 4,
      monthlyCost: 21400.0,
    },
    {
      cloudAccountId: gcpAccount.id,
      name: 'Web Application GKE',
      service: 'Kubernetes Engine (GKE)',
      type: 'Compute',
      region: 'Singapore',
      status: 'RUNNING',
      cpu: 12.0,
      memory: 48.0,
      storage: 300.0,
      instanceCount: 3,
      monthlyCost: 8920.0,
    },
    {
      cloudAccountId: gcpAccount.id,
      name: 'Analytics Data Warehouse',
      service: 'BigQuery Cluster',
      type: 'Database',
      region: 'East US',
      status: 'RUNNING',
      cpu: 16.0,
      memory: 64.0,
      storage: 10240.0,
      instanceCount: 1,
      monthlyCost: 4100.0,
    },
    {
      cloudAccountId: gcpAccount.id,
      name: 'AI Model Inference Pod',
      service: 'Vertex AI / Cloud Run',
      type: 'Compute',
      region: 'Singapore',
      status: 'RUNNING',
      cpu: 8.0,
      memory: 32.0,
      storage: 200.0,
      instanceCount: 2,
      monthlyCost: 1600.0,
    },
    {
      cloudAccountId: gcpAccount.id,
      name: 'Global Pub/Sub Bus',
      service: 'Google Pub/Sub',
      type: 'Compute',
      region: 'Singapore',
      status: 'RUNNING',
      cpu: 4.0,
      memory: 16.0,
      storage: 100.0,
      instanceCount: 1,
      monthlyCost: 500.0,
    },
  ];

  const createdResources = [];
  for (const resData of resourcesList) {
    const res = await prisma.resource.create({ data: resData });
    createdResources.push(res);
  }

  console.log(`📦 Created ${createdResources.length} cloud workloads across AWS, Azure, GCP`);

  // 5. Seed Historical Metrics (Past 30 days for rich queries)
  console.log('📊 Generating rich historical time-series metrics...');
  const now = new Date();
  const metricRecords = [];

  const resourceProfiles = {
    'Production API': { baseCpu: 62, cpuVar: 14, baseMem: 58, memVar: 8, baseLat: 118, latVar: 12, baseReq: 32000, reqVar: 4000 },
    'Customer Database': { baseCpu: 84, cpuVar: 8, baseMem: 79, memVar: 6, baseLat: 246, latVar: 20, baseReq: 24000, reqVar: 3000 },
    'Worker Service': { baseCpu: 54, cpuVar: 10, baseMem: 49, memVar: 6, baseLat: 132, latVar: 15, baseReq: 18000, reqVar: 2500 },
    'Redis Cache': { baseCpu: 91, cpuVar: 6, baseMem: 88, memVar: 5, baseLat: 310, latVar: 35, baseReq: 45000, reqVar: 6000 },
    'Web Application GKE': { baseCpu: 48, cpuVar: 12, baseMem: 52, memVar: 7, baseLat: 95, latVar: 10, baseReq: 15000, reqVar: 2000 },
  };

  // Generate 720 hourly points for the core resources (~30 days) and 48 points for others
  for (const resource of createdResources) {
    const isCore = resourceProfiles[resource.name];
    const profile = isCore || { baseCpu: 35, cpuVar: 10, baseMem: 42, memVar: 8, baseLat: 85, latVar: 15, baseReq: 5000, reqVar: 1000 };
    const pointCount = isCore ? 168 : 48; // 7 days hourly for core, 48h for others

    for (let i = pointCount; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hour = timestamp.getHours();
      const timeOfDayFactor = Math.sin(((hour - 6) / 24) * 2 * Math.PI) * 0.25 + 1.0;
      const noise = (Math.random() - 0.5) * 2;

      const cpuUsage = Math.min(99, Math.max(5, Math.round((profile.baseCpu * timeOfDayFactor + noise * profile.cpuVar) * 10) / 10));
      const memoryUsage = Math.min(99, Math.max(10, Math.round((profile.baseMem + noise * profile.memVar) * 10) / 10));
      const networkIn = Math.max(1, Math.round((28 * timeOfDayFactor + noise * 6) * 10) / 10);
      const networkOut = Math.max(1, Math.round((52 * timeOfDayFactor + noise * 10) * 10) / 10);
      const latency = Math.max(1, Math.round((profile.baseLat * (cpuUsage > 80 ? 1.3 : 1.0) + noise * profile.latVar) * 10) / 10);
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

  // Batch insert metrics in chunks
  const chunkSize = 250;
  for (let i = 0; i < metricRecords.length; i += chunkSize) {
    await prisma.metric.createMany({ data: metricRecords.slice(i, i + chunkSize) });
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
        reason: 'Traffic increased by 34% during the last hour. P99 latency increased to 118ms.',
        currentCapacity: 4,
        recommendedCapacity: 6,
        estimatedCostChange: 8400.0,
        confidence: 94.0,
        status: 'PENDING',
      },
    });
  }

  if (workerService) {
    await prisma.scalingRecommendation.create({
      data: {
        resourceId: workerService.id,
        type: 'SCALE_DOWN',
        reason: 'Worker queue processing latency remains under 50ms with average CPU < 40%. Downscaling recommended.',
        currentCapacity: 4,
        recommendedCapacity: 3,
        estimatedCostChange: -5350.0,
        confidence: 91.5,
        status: 'PENDING',
      },
    });
  }

  if (redisCache) {
    await prisma.scalingRecommendation.create({
      data: {
        resourceId: redisCache.id,
        type: 'RIGHTSIZE',
        reason: 'Memory saturation above 88% and sustained cache hit eviction rate.',
        currentCapacity: 2,
        recommendedCapacity: 3,
        estimatedCostChange: 9450.0,
        confidence: 89.0,
        status: 'PENDING',
      },
    });
  }

  console.log('🤖 Created intelligent scaling recommendations');

  // 7. Seed 6 Months of Cost Records (April to September)
  console.log('💰 Generating 6 months of historical cost records...');
  const monthlyCostTotals = [
    { monthOffset: 5, monthName: 'Apr', aws: 79200, azure: 43200, gcp: 29600 },
    { monthOffset: 4, monthName: 'May', aws: 83500, azure: 46100, gcp: 31800 },
    { monthOffset: 3, monthName: 'Jun', aws: 87800, azure: 48600, gcp: 33400 },
    { monthOffset: 2, monthName: 'Jul', aws: 90200, azure: 49800, gcp: 34200 },
    { monthOffset: 1, monthName: 'Aug', aws: 92800, azure: 51200, gcp: 35500 },
    { monthOffset: 0, monthName: 'Sep', aws: 95700, azure: 52400, gcp: 36520 }, // Total = 184,620
  ];

  const costRecords = [];
  for (const m of monthlyCostTotals) {
    const d = new Date(now.getFullYear(), now.getMonth() - m.monthOffset, 15);
    costRecords.push({
      cloudAccountId: awsAccount.id,
      service: 'AWS Compute & Database Services',
      date: d,
      cost: m.aws,
      usage: 'EC2, RDS, ElastiCache, S3 Standard',
    });
    costRecords.push({
      cloudAccountId: azureAccount.id,
      service: 'Azure Enterprise Services',
      date: d,
      cost: m.azure,
      usage: 'PostgreSQL Multi-AZ, Container Apps',
    });
    costRecords.push({
      cloudAccountId: gcpAccount.id,
      service: 'Google Cloud Platform Services',
      date: d,
      cost: m.gcp,
      usage: 'GKE Nodes, Cloud Storage, Vertex AI',
    });
  }

  // Also add daily records for the current 30 days
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    date.setHours(0, 0, 0, 0);
    const variance = (Math.random() - 0.5) * 80;

    costRecords.push({
      cloudAccountId: awsAccount.id,
      service: 'AWS Daily Telemetry',
      date,
      cost: Math.round((3190 + variance) * 10) / 10,
      usage: 'Active instances & multi-AZ database usage',
    });
    costRecords.push({
      cloudAccountId: azureAccount.id,
      service: 'Azure Daily Telemetry',
      date,
      cost: Math.round((1746 + variance * 0.4) * 10) / 10,
      usage: 'PostgreSQL instance hours & egress',
    });
    costRecords.push({
      cloudAccountId: gcpAccount.id,
      service: 'GCP Daily Telemetry',
      date,
      cost: Math.round((1217 + variance * 0.3) * 10) / 10,
      usage: 'GKE cluster compute seconds',
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
        maxMonthlyBudget: 250000.0,
        requireApproval: true,
        enabled: true,
      },
      {
        name: 'Staging Auto-Scale Limit',
        maxInstanceCount: 8,
        maxMonthlyBudget: 60000.0,
        requireApproval: false,
        enabled: true,
      },
      {
        name: 'High-Traffic Emergency Ceiling',
        maxInstanceCount: 32,
        maxMonthlyBudget: 400000.0,
        requireApproval: true,
        enabled: false,
      },
    ],
  });

  console.log('🛡️ Created governance policies');

  // 9. Seed Audit Logs & Recent Activities
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'SCALE_RESOURCE',
        resourceId: prodApi?.id || null,
        details: JSON.stringify({
          message: 'Admin approved scaling for Production API',
          resourceName: 'Production API',
          previousCapacity: 4,
          newCapacity: 6,
          user: 'Admin User',
        }),
        createdAt: new Date(now.getTime() - 15 * 60 * 1000), // 15m ago
      },
      {
        userId: operator.id,
        action: 'SCALE_RESOURCE',
        resourceId: workerService?.id || null,
        details: JSON.stringify({
          message: 'Operator updated Worker Service capacity',
          resourceName: 'Worker Service',
          previousCapacity: 5,
          newCapacity: 4,
          user: 'DevOps Engineer',
        }),
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1h ago
      },
      {
        userId: null,
        action: 'SYSTEM_EVENT',
        resourceId: prodApi?.id || null,
        details: JSON.stringify({
          message: 'CloudOps detected traffic spike (+34% on API Gateway)',
          user: 'CloudOps Engine',
        }),
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2h ago
      },
      {
        userId: null,
        action: 'OPTIMIZATION_GENERATED',
        resourceId: workerService?.id || null,
        details: JSON.stringify({
          message: 'Cost optimization recommendation generated for Worker Service (Save ₹5,350/mo)',
          user: 'AI Rightsizer',
        }),
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4h ago
      },
      {
        userId: null,
        action: 'HEALTH_ALERT',
        resourceId: null,
        details: JSON.stringify({
          message: 'Customer Database entered warning state (CPU 84%, RAM 79%)',
          user: 'Health Watcher',
        }),
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6h ago
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

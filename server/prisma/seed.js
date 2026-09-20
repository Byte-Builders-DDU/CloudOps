import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for CloudOps Platform (PRD/DESIGN Compliant)...');

  // 1. Clean existing records in reverse dependency order
  await prisma.copilotCitation.deleteMany({});
  await prisma.copilotMessage.deleteMany({});
  await prisma.copilotThread.deleteMany({});
  await prisma.changeOperation.deleteMany({});
  await prisma.changeRequest.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.scalingRecommendation.deleteMany({});
  await prisma.metric.deleteMany({});
  await prisma.costRecord.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.policy.deleteMany({});
  await prisma.budget.deleteMany({});
  await prisma.cloudAccount.deleteMany({});
  await prisma.workspaceMembership.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database tables.');

  // 2. Create Multi-Tenant Workspaces
  const defaultWorkspace = await prisma.workspace.create({
    data: {
      id: 'ws-prod-001',
      slug: 'default',
      name: 'Production Cloud Operations',
      isDemo: false,
      currency: 'INR',
      aiMonthlyBudget: 50.0,
      currentAiSpend: 4.82,
    },
  });

  const demoWorkspace = await prisma.workspace.create({
    data: {
      id: 'ws-demo-002',
      slug: 'demo',
      name: 'Isolated Demo Sandbox',
      isDemo: true,
      currency: 'INR',
      aiMonthlyBudget: 25.0,
      currentAiSpend: 1.25,
    },
  });

  console.log('🏢 Created Workspaces: default (Production Cloud) & demo (Sandbox)');

  // 3. Create Users with Hashed Passwords
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('cloudops123', salt);

  const admin = await prisma.user.create({
    data: {
      id: 'usr-admin-01',
      name: 'Apurv Admin',
      email: 'admin@cloudops.dev',
      password: hashedPassword,
      role: 'ADMIN',
      systemRole: 'SUPERADMIN',
    },
  });

  const secopsAdmin = await prisma.user.create({
    data: {
      id: 'usr-admin-02',
      name: 'SecOps Approver',
      email: 'secops@cloudops.dev',
      password: hashedPassword,
      role: 'ADMIN',
      systemRole: 'USER',
    },
  });

  const operator = await prisma.user.create({
    data: {
      id: 'usr-operator-01',
      name: 'DevOps Engineer',
      email: 'operator@cloudops.dev',
      password: hashedPassword,
      role: 'OPERATOR',
      systemRole: 'USER',
    },
  });

  const viewer = await prisma.user.create({
    data: {
      id: 'usr-viewer-01',
      name: 'Product & Finance Analyst',
      email: 'viewer@cloudops.dev',
      password: hashedPassword,
      role: 'VIEWER',
      systemRole: 'USER',
    },
  });

  console.log('👥 Created Users: admin, secops (second admin), operator, viewer');

  // 4. Create Workspace Memberships
  await prisma.workspaceMembership.createMany({
    data: [
      { workspaceId: defaultWorkspace.id, userId: admin.id, role: 'ADMIN' },
      { workspaceId: defaultWorkspace.id, userId: secopsAdmin.id, role: 'ADMIN' },
      { workspaceId: defaultWorkspace.id, userId: operator.id, role: 'OPERATOR' },
      { workspaceId: defaultWorkspace.id, userId: viewer.id, role: 'VIEWER' },
      { workspaceId: demoWorkspace.id, userId: admin.id, role: 'ADMIN' },
      { workspaceId: demoWorkspace.id, userId: operator.id, role: 'OPERATOR' },
      { workspaceId: demoWorkspace.id, userId: viewer.id, role: 'VIEWER' },
    ],
  });

  // 5. Create Cloud Accounts
  const awsAccount = await prisma.cloudAccount.create({
    data: {
      id: 'acc-aws-01',
      workspaceId: defaultWorkspace.id,
      provider: 'AWS',
      accountName: 'Production-AWS-Mumbai (7829-1029-4401)',
      accountId: '782910294401',
      region: 'ap-south-1',
      status: 'ACTIVE',
    },
  });

  const azureAccount = await prisma.cloudAccount.create({
    data: {
      id: 'acc-azure-01',
      workspaceId: defaultWorkspace.id,
      provider: 'Azure',
      accountName: 'Enterprise-Azure-Singapore (sub-91823)',
      accountId: 'sub-91823-prod',
      region: 'southeastasia',
      status: 'ACTIVE',
    },
  });

  const gcpAccount = await prisma.cloudAccount.create({
    data: {
      id: 'acc-gcp-01',
      workspaceId: defaultWorkspace.id,
      provider: 'GCP',
      accountName: 'GCP-Data-Frankfurt (proj-dataops-99)',
      accountId: 'proj-dataops-99',
      region: 'europe-west3',
      status: 'ACTIVE',
    },
  });

  // 6. Create Logical Services
  const productionApi = await prisma.service.create({
    data: {
      id: 'svc-prod-api',
      workspaceId: defaultWorkspace.id,
      name: 'Production API',
      environment: 'PRODUCTION',
      owner: 'team-backend@cloudops.dev',
      health: 'WARNING', // Warning due to Journey A traffic surge
    },
  });

  const paymentGateway = await prisma.service.create({
    data: {
      id: 'svc-payment-gw',
      workspaceId: defaultWorkspace.id,
      name: 'Payment Gateway',
      environment: 'PRODUCTION',
      owner: 'team-payments@cloudops.dev',
      health: 'HEALTHY',
    },
  });

  const workerService = await prisma.service.create({
    data: {
      id: 'svc-worker-svc',
      workspaceId: defaultWorkspace.id,
      name: 'Worker Service',
      environment: 'PRODUCTION',
      owner: 'team-data@cloudops.dev',
      health: 'HEALTHY',
    },
  });

  console.log('📦 Created Services: Production API, Payment Gateway, Worker Service');

  // 7. Create Infrastructure Resources (with Journey A specific pricing)
  // PRD Journey A: 4 replicas at INR 4,200/replica = INR 16,800/month
  // Unit hourly rate = 4200 / 730 = ~5.7534 INR/hr
  const apiAsg = await prisma.resource.create({
    data: {
      id: 'res-api-asg',
      cloudAccountId: awsAccount.id,
      serviceId: productionApi.id,
      name: 'api-asg',
      providerResourceId: 'arn:aws:autoscaling:ap-south-1:782910294401:autoScalingGroupName/api-asg',
      type: 'Compute',
      service: 'EC2',
      region: 'ap-south-1',
      status: 'RUNNING',
      controllerOwnership: 'CLOUDOPS',
      cpu: 4.0,
      memory: 16.0,
      storage: 100.0,
      instanceCount: 4,
      minInstances: 2,
      maxInstances: 8,
      monthlyCost: 16800.0,
      hourlyRate: 5.7534,
      version: 1,
    },
  });

  const prodDb = await prisma.resource.create({
    data: {
      id: 'res-prod-db',
      cloudAccountId: awsAccount.id,
      serviceId: productionApi.id,
      name: 'prod-db-cluster',
      providerResourceId: 'arn:aws:rds:ap-south-1:782910294401:db:prod-db-cluster',
      type: 'Database',
      service: 'RDS',
      region: 'ap-south-1',
      status: 'RUNNING',
      controllerOwnership: 'READ_ONLY',
      cpu: 8.0,
      memory: 32.0,
      storage: 500.0,
      instanceCount: 1,
      minInstances: 1,
      maxInstances: 1,
      monthlyCost: 28500.0,
      hourlyRate: 39.041,
      version: 1,
    },
  });

  const paymentK8s = await prisma.resource.create({
    data: {
      id: 'res-payment-k8s',
      cloudAccountId: azureAccount.id,
      serviceId: paymentGateway.id,
      name: 'aks-payment-cluster',
      providerResourceId: '/subscriptions/sub-91823/resourceGroups/payments/providers/Microsoft.ContainerService/managedClusters/aks-payment',
      type: 'Compute',
      service: 'AKS',
      region: 'southeastasia',
      status: 'RUNNING',
      controllerOwnership: 'CLOUDOPS',
      cpu: 6.0,
      memory: 24.0,
      storage: 200.0,
      instanceCount: 3,
      minInstances: 2,
      maxInstances: 6,
      monthlyCost: 18200.0,
      hourlyRate: 8.3105,
      version: 1,
    },
  });

  const workerMig = await prisma.resource.create({
    data: {
      id: 'res-worker-mig',
      cloudAccountId: gcpAccount.id,
      serviceId: workerService.id,
      name: 'worker-pool-mig',
      providerResourceId: 'projects/proj-dataops-99/zones/europe-west3-a/instanceGroupManagers/worker-pool-mig',
      type: 'Compute',
      service: 'Compute',
      region: 'europe-west3',
      status: 'RUNNING',
      controllerOwnership: 'CLOUDOPS',
      cpu: 4.0,
      memory: 16.0,
      storage: 100.0,
      instanceCount: 2,
      minInstances: 1,
      maxInstances: 6,
      monthlyCost: 11400.0,
      hourlyRate: 7.8082,
      version: 1,
    },
  });

  console.log('🖥️ Created Resources: api-asg, prod-db, payment cluster, worker pool');

  // 8. Create Budgets
  const monthlyBudget = await prisma.budget.create({
    data: {
      id: 'bgt-monthly-01',
      workspaceId: defaultWorkspace.id,
      name: 'Monthly Production Infrastructure Budget',
      period: 'MONTHLY',
      amount: 200000.0,
      currency: 'INR',
      warningThresholdPct: 80.0,
      hardEnforce: true,
    },
  });

  // 9. Create Governance Policies (with Separate Approver Rule for Production API)
  await prisma.policy.create({
    data: {
      id: 'pol-prod-api-01',
      workspaceId: defaultWorkspace.id,
      name: 'Production API Safety & Capacity Policy',
      scopeType: 'SERVICE',
      scopeTargetId: productionApi.id,
      minInstanceCount: 2,
      maxInstanceCount: 8,
      maxStepSize: 2,
      cooldownMinutes: 5,
      allowedActions: 'SCALE_UP,SCALE_DOWN,RESTART',
      requireApproval: true,
      requireSeparateAdmin: true, // Crucial for Journey A: Requester cannot self-approve
      linkedBudgetId: monthlyBudget.id,
      enabled: true,
    },
  });

  await prisma.policy.create({
    data: {
      id: 'pol-global-01',
      workspaceId: defaultWorkspace.id,
      name: 'Workspace Global Capacity Guardrail',
      scopeType: 'WORKSPACE',
      minInstanceCount: 1,
      maxInstanceCount: 12,
      maxStepSize: 3,
      cooldownMinutes: 5,
      allowedActions: 'SCALE_UP,SCALE_DOWN,RESTART',
      requireApproval: true,
      requireSeparateAdmin: false,
      linkedBudgetId: monthlyBudget.id,
      enabled: true,
    },
  });

  console.log('🛡️ Created Governance Policies (Separate Approver enforced for Production API)');

  // 10. Seed Telemetry Metrics (Injecting Journey A Surge on api-asg)
  console.log('📈 Seeding historical telemetry and Journey A surge event...');
  const now = Date.now();
  const metricBatch = [];

  // Generate 24 hours of hourly history
  for (let i = 24; i > 0; i--) {
    const timestamp = new Date(now - i * 60 * 60 * 1000);
    
    // Baseline for api-asg
    metricBatch.push({
      resourceId: apiAsg.id,
      timestamp,
      cpuUsage: 54.0 + (Math.sin(i) * 6),
      memoryUsage: 62.0 + (Math.cos(i) * 4),
      networkIn: 24.5,
      networkOut: 48.2,
      latency: 95.0,
      latencyP95: 122.0,
      requests: 18000,
      errorRate: 0.02,
      uptimeProbesSuccess: 60,
      uptimeProbesTotal: 60,
      coveragePercent: 100.0,
    });

    // Baseline for paymentK8s
    metricBatch.push({
      resourceId: paymentK8s.id,
      timestamp,
      cpuUsage: 45.0,
      memoryUsage: 52.0,
      networkIn: 18.0,
      networkOut: 32.0,
      latency: 68.0,
      latencyP95: 88.0,
      requests: 9500,
      errorRate: 0.0,
      uptimeProbesSuccess: 60,
      uptimeProbesTotal: 60,
      coveragePercent: 100.0,
    });

    // Baseline for workerMig (Idle candidate)
    metricBatch.push({
      resourceId: workerMig.id,
      timestamp,
      cpuUsage: 22.0,
      memoryUsage: 35.0,
      networkIn: 5.0,
      networkOut: 8.0,
      latency: 35.0,
      latencyP95: 42.0,
      requests: 2200,
      errorRate: 0.0,
      uptimeProbesSuccess: 60,
      uptimeProbesTotal: 60,
      coveragePercent: 100.0,
    });
  }

  // Inject Journey A: Over the last 10 minutes, traffic rose +34% and CPU averaged 82%
  for (let m = 10; m >= 0; m--) {
    const timestamp = new Date(now - m * 60 * 1000);
    metricBatch.push({
      resourceId: apiAsg.id,
      timestamp,
      cpuUsage: 82.0 + (Math.random() * 3 - 1.5), // ~82% CPU
      memoryUsage: 76.5,
      networkIn: 48.0,
      networkOut: 96.5,
      latency: 142.0,
      latencyP95: 188.0, // Latency elevation
      requests: 24120,   // +34% over 18,000 baseline
      errorRate: 0.05,
      uptimeProbesSuccess: 6,
      uptimeProbesTotal: 6,
      coveragePercent: 98.0,
    });
  }

  await prisma.metric.createMany({ data: metricBatch });

  // 11. Create Scaling Recommendations
  // Journey A: api-asg scale up from 4 to 6 replicas (+INR 8,400 monthly, +INR 4,200 remaining period)
  await prisma.scalingRecommendation.create({
    data: {
      id: 'rec-surge-01',
      resourceId: apiAsg.id,
      type: 'SCALE_UP',
      basisMethod: 'RULE_BASED',
      reason: 'Traffic increased 34% with CPU averaging 82% over the last 10 minutes. Scaling from 4 to 6 replicas will return utilization to the 60% target.',
      evidenceWindow: JSON.stringify({
        windowMinutes: 10,
        trafficDelta: 34,
        cpuAvg: 82.0,
        p95Latency: 188.0,
        currentReplicas: 4,
        proposedReplicas: 6,
      }),
      evidenceQuality: 'HIGH',
      currentCapacity: 4,
      recommendedCapacity: 6,
      estimatedCostChange: 8400.0, // +INR 8,400/month
      remainingPeriodDelta: 4200.0, // +INR 4,200 for remaining 365h
      confidence: 96.0,
      urgency: 'HIGH',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15m validity
    },
  });

  // Downscale recommendation for workerMig
  await prisma.scalingRecommendation.create({
    data: {
      id: 'rec-idle-01',
      resourceId: workerMig.id,
      type: 'SCALE_DOWN',
      basisMethod: 'STATISTICAL',
      reason: 'Worker pool CPU has remained below 25% with zero queue delay for over 24 hours. Reducing capacity from 2 to 1 replica will reduce monthly spend.',
      evidenceWindow: JSON.stringify({
        windowHours: 24,
        cpuAvg: 22.0,
        memoryAvg: 35.0,
      }),
      evidenceQuality: 'HIGH',
      currentCapacity: 2,
      recommendedCapacity: 1,
      estimatedCostChange: -5700.0,
      remainingPeriodDelta: -2850.0,
      confidence: 91.0,
      urgency: 'LOW',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  // 12. Create Cost Records (30 days of daily history)
  console.log('💰 Seeding daily cost records...');
  const costBatch = [];
  for (let d = 30; d >= 0; d--) {
    const date = new Date(now - d * 24 * 60 * 60 * 1000);
    costBatch.push({
      cloudAccountId: awsAccount.id,
      service: 'EC2',
      environment: 'PRODUCTION',
      date,
      cost: 560.0 + (Math.random() * 20),
      currency: 'INR',
      isFinalized: d > 2,
      isUnattributed: false,
    });
    costBatch.push({
      cloudAccountId: awsAccount.id,
      service: 'RDS',
      environment: 'PRODUCTION',
      date,
      cost: 950.0,
      currency: 'INR',
      isFinalized: d > 2,
      isUnattributed: false,
    });
    costBatch.push({
      cloudAccountId: azureAccount.id,
      service: 'AKS',
      environment: 'PRODUCTION',
      date,
      cost: 606.0,
      currency: 'INR',
      isFinalized: d > 2,
      isUnattributed: false,
    });
    costBatch.push({
      cloudAccountId: gcpAccount.id,
      service: 'Compute',
      environment: 'PRODUCTION',
      date,
      cost: 380.0,
      currency: 'INR',
      isFinalized: d > 2,
      isUnattributed: false,
    });
  }
  await prisma.costRecord.createMany({ data: costBatch });

  // 13. Create Notifications and Audit Logs
  await prisma.notification.create({
    data: {
      workspaceId: defaultWorkspace.id,
      severity: 'WARNING',
      title: 'Traffic Surge Detected on Production API',
      message: 'Traffic rose 34% with CPU averaging 82% over 10m. Recommendation to scale to 6 replicas generated.',
      linkUrl: '/w/default/recommendations',
    },
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: defaultWorkspace.id,
      userId: admin.id,
      action: 'WORKSPACE_INITIALIZED',
      targetType: 'WORKSPACE',
      targetId: defaultWorkspace.id,
      source: 'MANUAL',
      details: JSON.stringify({ message: 'Production Cloud Operations workspace initialized with 3 cloud providers.' }),
      outcome: 'SUCCESS',
    },
  });

  console.log('✅ Database seed completed successfully!');
  console.log('🔑 Demo Login Credentials:');
  console.log('   Admin:    admin@cloudops.dev / cloudops123');
  console.log('   SecOps:   secops@cloudops.dev / cloudops123 (Second Admin for Two-Person Approval)');
  console.log('   Operator: operator@cloudops.dev / cloudops123');
  console.log('   Viewer:   viewer@cloudops.dev / cloudops123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

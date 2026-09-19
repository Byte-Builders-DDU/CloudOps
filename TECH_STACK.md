# CloudOps — Technology Stack & Architecture Specification

| Field | Value |
| --- | --- |
| Problem statement | PS-10: Unified Cloud Resource, Scaling & Cost Management Platform |
| Version | 2.0 — Greenfield architecture baseline |
| Date | 2026-09-19 |
| Status | Proposed technical contract |
| Product contract | [PRD.md](PRD.md) |
| Design contract | [DESIGN.md](DESIGN.md) |

---

## 1. Executive Summary & Architecture Principles

**CloudOps** is an enterprise multi-cloud operational control plane that unifies telemetry monitoring, cost governance, autonomous recommendation generation, and human-in-the-loop change execution. The platform is designed around strict tenant isolation, deterministic financial and policy calculations, attributable AI assistance, and resilient multi-cloud orchestration.

### Core Architectural Principles

1. **Deterministic Core with Generative Guidance**: Financial calculations, policy boundaries, and capacity calculations are 100% deterministic and reproducible. Generative AI explains, summarizes, and drafts proposals, but cannot mutate cloud infrastructure directly.
2. **Attributable Intelligence**: Every AI statement and recommendation must cite verifiable database records (telemetry windows, pricing catalog entries, or policy rules).
3. **Defense-in-Depth Multi-Tenancy**: Tenant isolation (by `Workspace`) is enforced at the database query layer, caching layer, WebSocket routing, and LLM tool execution layer.
4. **Idempotent & Reconciled Operations**: Cloud mutations are dispatched through a durable asynchronous worker pipeline with idempotency keys, state reconciliation, and strict pre-execution revalidation.
5. **Provider-Agnostic Abstraction with Honest Parity**: The core control plane operates on unified canonical models (`Service`, `Resource`, `TelemetryObservation`, `CostRecord`), while provider-specific adapters isolate cloud SDK variances (AWS, Azure, GCP, and Mock).
6. **Graceful Degradation**: If AI services, external cloud APIs, or metric streams encounter downtime or rate limits, core telemetry visualization, policy enforcement, and manual operations remain fully functional.

---

## 2. High-Level System Topology

```mermaid
flowchart TB
    subgraph ClientTier [Frontend Client Tier - React 18 + Vite]
        UI[Tailwind CSS + Lucide Icons]
        Router[React Router v7 / URL-Backed Scope]
        Charts[Recharts Visualization Engine]
        WSClient[Socket.IO Client - Live Telemetry]
        AxiosClient[Axios API Client - JWT Interceptors]
    end

    subgraph IngressTier [Gateway & Ingress Layer]
        API_GW[Express REST API Gateway]
        WSServer[Socket.IO Server - Pub/Sub Broadcaster]
        AuthMW[JWT & RBAC Authorization Middleware]
        TenantMW[Workspace Context Resolver]
    end

    subgraph CoreEngineTier [Domain Engines & Services]
        DetEngine[Deterministic Analytics & Aggregation Engine]
        PolicyEngine[Policy & Safety Bounds Evaluator]
        PricingEngine[Financial Pricing & Run-Rate Engine]
        RecEngine[Recommendation & Rightsizing Engine]
        CopilotEngine[AI Copilot & Attributable Citations Engine]
        AuditEngine[Append-Only Audit Logging Service]
    end

    subgraph WorkerTier [Durable Execution & Background Jobs]
        Queue[Durable Job Queue / Worker Pipeline]
        ExecWorker[Execution Worker - Idempotent Mutations]
        Reconciler[Provider State Reconciler]
        SimWorker[Telemetry Simulator & Surge Generator]
    end

    subgraph DataTier [Persistence & Storage Layer]
        PrismaORM[Prisma ORM Client]
        MainDB[(PostgreSQL / SQLite Storage)]
        TimeSeries[(Telemetry & Aggregated Rollups)]
        VectorDB[(Runbook & Document Knowledge Index - R2)]
    end

    subgraph CloudAdapterTier [Pluggable Cloud Provider Abstraction]
        CloudInterface["<<interface>> CloudProvider"]
        MockAdapter[MockCloudProvider - Realistic Simulation]
        AWSAdapter[AWSCloudProvider - AWS SDK v3]
        AzureAdapter[AzureCloudProvider - Azure ARM SDK]
        GCPAdapter[GCPCloudProvider - Google Cloud SDK]
    end

    subgraph ExternalServices [External Integrations]
        LLM[LLM Provider - Gemini / OpenAI / Bedrock]
        LiveAWS[AWS: EC2, CloudWatch, Cost Explorer, ASG]
        LiveAzure[Azure: Compute, Azure Monitor, Cost Mgt]
        LiveGCP[GCP: Compute Engine, Monitoring, Billing]
    end

    ClientTier -->|REST API over HTTPS| API_GW
    ClientTier -->|Bi-directional WebSocket| WSServer
    
    API_GW --> AuthMW --> TenantMW
    TenantMW --> CoreEngineTier
    
    CopilotEngine -->|Tool Calls| DetEngine
    CopilotEngine -->|Tool Calls| PricingEngine
    CopilotEngine -->|Tool Calls| PolicyEngine
    CopilotEngine -->|Prompt + Context| LLM

    CoreEngineTier --> PrismaORM
    WorkerTier --> PrismaORM
    PrismaORM --> MainDB
    PrismaORM --> TimeSeries
    CopilotEngine -.-> VectorDB

    CoreEngineTier --> Queue
    Queue --> ExecWorker
    ExecWorker --> Reconciler
    ExecWorker --> CloudAdapterTier
    SimWorker --> PrismaORM
    SimWorker --> WSServer

    CloudAdapterTier --> CloudInterface
    CloudInterface --> MockAdapter
    CloudInterface --> AWSAdapter
    CloudInterface --> AzureAdapter
    CloudInterface --> GCPAdapter

    AWSAdapter --> LiveAWS
    AzureAdapter --> LiveAzure
    GCPAdapter --> LiveGCP
```

---

## 3. Technology Stack Matrix

### 3.1 Frontend Web Application

| Component | Selected Technology | Version | Rationale & Tradeoffs |
| --- | --- | --- | --- |
| **Framework** | React | `^18.3.1` | Declarative UI, robust component ecosystem, concurrent features, universal developer familiarity. |
| **Build Tool** | Vite | `^6.0.7` | Near-instant HMR, optimized Rollup bundling, native ES module support during development. |
| **Routing** | React Router DOM | `^7.1.1` | First-class URL state management, nested workspace routing (`/w/:slug/*`), loader/action patterns. |
| **Styling** | Tailwind CSS | `^3.4.17` | Utility-first styling matching DESIGN.md tokens, zero CSS runtime overhead, predictable responsive breakpoints. |
| **CSS Processing**| PostCSS + Autoprefixer | `^8.4.49` / `^10.4.20` | Cross-browser CSS compatibility and vendor prefixing. |
| **Icons** | Lucide React | `^0.469.0` | Comprehensive, consistent 24px icon set, tree-shakeable, clean SVGs for operational status indicators. |
| **Charts & Graphs**| Recharts | `^2.15.0` | Declarative SVG charting for time-series telemetry, cost trends, and multi-cloud breakdown visualizations. |
| **Real-Time Client**| Socket.IO Client | `^4.8.1` | Automatic fallback to long-polling, heartbeat monitoring, room-based workspace subscriptions for live telemetry. |
| **HTTP Client** | Axios | `^1.7.9` | Request/response interceptors for automatic JWT injection, unified error normalization, and cancel tokens. |
| **Fonts** | Google Fonts (Inter + JetBrains Mono) | Web font | Inter for clean operational UI density; JetBrains Mono for financial figures, tabular metrics, and timestamps. |

### 3.2 Backend Server & API Services

| Component | Selected Technology | Version | Rationale & Tradeoffs |
| --- | --- | --- | --- |
| **Runtime** | Node.js (ES Modules) | `>=18.18.0` | Non-blocking I/O ideal for telemetry ingestion, WebSocket fan-out, and async cloud provider SDKs. |
| **Web Server** | Express.js | `^4.21.2` | Minimalist, unopinionated web framework, battle-tested middleware ecosystem, high throughput. |
| **Real-Time Gateway**| Socket.IO Server | `^4.8.1` | WebSocket server with room multiplexing (`workspace:id`), reconnection resilience, and binary packet support. |
| **ORM** | Prisma ORM | `^5.22.0` | Type-safe database queries, automated migrations, declarative schema definition, unified client API. |
| **Database** | PostgreSQL 16 (Target) / SQLite 3 (Dev/Demo) | `5.x / 3.x` | PostgreSQL for ACID guarantees, JSONB indexing, and pgvector support in R1/R2; SQLite for zero-config local demos. |
| **Authentication**| JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` | `^9.0.2` / `^2.4.3` | Stateless authorization with signed claims (`workspaceId`, `role`); cryptographically secure password hashing. |
| **Configuration** | `dotenv` | `^16.4.7` | 12-factor application configuration loaded via environment variables. |
| **Cross-Origin** | `cors` | `^2.8.5` | Configurable origin and credential policy for client-server decoupling. |

### 3.3 Intelligence, Analytics & Cloud Integration

| Component | Selected Technology | Target Version | Rationale & Tradeoffs |
| --- | --- | --- | --- |
| **LLM Provider** | Google Gemini API (`@google/genai`) / Anthropic Claude / AWS Bedrock | SDK v1 / v3 | High reasoning capability, large context window for operational metrics, native JSON schema function calling. |
| **AI Tool Calling**| Deterministic Tool Interface | Custom JSON Schema | Read-only workspace tools returning structured JSON evidence with citation keys. Direct database mutation via chat is prohibited. |
| **Document Search (R2)**| PostgreSQL `pgvector` / Full-Text Search | Extension / Native | Semantic vector search across uploaded runbooks and post-mortems with similarity scores and document versioning. |
| **AWS Cloud SDK (R2)**| `@aws-sdk/client-ec2`, `@aws-sdk/client-auto-scaling`, `@aws-sdk/client-cloudwatch`, `@aws-sdk/client-cost-explorer` | `^3.700.0` | Modular AWS SDK v3 with minimal bundle footprints and IAM Role / STS AssumeRole credential support. |
| **Azure SDK (R3)**| `@azure/arm-compute`, `@azure/arm-monitor`, `@azure/arm-consumption` | Latest | Azure Resource Manager client libraries using Service Principal / Managed Identity credentials. |
| **GCP SDK (R3)** | `@google-cloud/compute`, `@google-cloud/monitoring`, `@google-cloud/billing` | Latest | Google Cloud client libraries using Service Account JSON / Workload Identity Federation. |
| **Job Queue & Tasks**| In-memory async worker (R1) / Redis + BullMQ (R2/R3) | Node event loop / BullMQ | Idempotent background change execution, telemetry downsampling, and automated provider reconciliation. |

---

## 4. Comprehensive Relational Data Model

The data model is expressed in Prisma schema syntax. It provides multi-tenant workspace isolation, logical-to-physical resource mappings, append-only audit histories, versioned change requests, and attributable AI citation structures.

```prisma
datasource db {
  provider = "sqlite" // Configurable to "postgresql" for staging/production deployments
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ---------------------------------------------------------------------------
// Tenancy & Identity
// ---------------------------------------------------------------------------

model Workspace {
  id                 String                @id @default(uuid())
  slug               String                @unique
  name               String
  isDemo             Boolean               @default(false)
  currency           String                @default("INR") // "INR", "USD", "EUR"
  aiMonthlyBudget    Float                 @default(50.0) // In USD
  currentAiSpend     Float                 @default(0.0)
  createdAt          DateTime              @default(now())
  updatedAt          DateTime              @updatedAt

  memberships        WorkspaceMembership[]
  cloudAccounts      CloudAccount[]
  services           Service[]
  policies           Policy[]
  budgets            Budget[]
  changeRequests     ChangeRequest[]
  auditLogs          AuditLog[]
  copilotThreads     CopilotThread[]
  knowledgeDocuments KnowledgeDocument[]
  notifications      Notification[]
}

model User {
  id                 String                @id @default(uuid())
  email              String                @unique
  name               String
  password           String
  systemRole         String                @default("USER") // "USER", "SUPERADMIN"
  createdAt          DateTime              @default(now())
  updatedAt          DateTime              @updatedAt

  memberships        WorkspaceMembership[]
  auditLogs          AuditLog[]
  initiatedRequests  ChangeRequest[]       @relation("RequesterRelation")
  approvedRequests   ChangeRequest[]       @relation("ApproverRelation")
  copilotThreads     CopilotThread[]
  notifications      Notification[]
}

model WorkspaceMembership {
  id          String    @id @default(uuid())
  workspaceId String
  userId      String
  role        String    @default("VIEWER") // "ADMIN", "OPERATOR", "VIEWER"
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
}

// ---------------------------------------------------------------------------
// Cloud Infrastructure & Logical Services
// ---------------------------------------------------------------------------

model CloudAccount {
  id          String     @id @default(uuid())
  workspaceId String
  provider    String     // "AWS", "Azure", "GCP", "MOCK"
  accountName String
  accountId   String     // Cloud provider assigned account/subscription ID
  region      String     // Primary canonical region
  roleArn     String?    // IAM Role ARN for cross-account assume-role
  status      String     @default("ACTIVE") // "ACTIVE", "WARNING", "ERROR", "SYNCING"
  lastSyncAt  DateTime   @default(now())
  createdAt   DateTime   @default(now())

  workspace   Workspace  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  resources   Resource[]
  costRecords CostRecord[]
}

model Service {
  id             String         @id @default(uuid())
  workspaceId    String
  name           String         // e.g., "Production API", "Payment Gateway"
  environment    String         @default("PRODUCTION") // "PRODUCTION", "STAGING", "DEV"
  owner          String         // Team/Individual email or tag
  health         String         @default("HEALTHY") // "HEALTHY", "WARNING", "CRITICAL", "UNKNOWN"
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  workspace      Workspace      @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  resources      Resource[]
  changeRequests ChangeRequest[]
}

model Resource {
  id                     String                  @id @default(uuid())
  cloudAccountId         String
  serviceId              String?
  name                   String                  // Physical resource name (e.g. "api-asg", "prod-db")
  providerResourceId     String?                 // e.g. "arn:aws:autoscaling:ap-south-1:...:autoScalingGroupName/api-asg"
  type                   String                  // "Compute", "Database", "Storage", "Cache", "Serverless"
  service                String                  // "EC2", "RDS", "S3", "ElastiCache", "AKS"
  region                 String                  // Canonical region: "ap-south-1", "eastus", "us-central1"
  status                 String                  @default("RUNNING") // "RUNNING", "STOPPED", "DEGRADED", "SCALING"
  controllerOwnership    String                  @default("CLOUDOPS") // "CLOUDOPS", "EXTERNAL_ASG", "READ_ONLY"
  
  // Sizing & Configuration
  cpu                    Float                   // vCPU allocation
  memory                 Float                   // RAM in GB
  storage                Float                   // Storage in GB
  instanceCount          Int                     @default(1)
  minInstances           Int                     @default(1)
  maxInstances           Int                     @default(10)
  monthlyCost            Float                   // Computed monthly run-rate in workspace currency
  hourlyRate             Float                   @default(0.0) // Hourly unit rate
  
  version                Int                     @default(1) // Optimistic locking version
  createdAt              DateTime                @default(now())
  updatedAt              DateTime                @updatedAt

  cloudAccount           CloudAccount            @relation(fields: [cloudAccountId], references: [id], onDelete: Cascade)
  logicalService         Service?                @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  metrics                Metric[]
  scalingRecommendations ScalingRecommendation[]
  changeRequests         ChangeRequest[]
}

// ---------------------------------------------------------------------------
// Telemetry, Metrics & Observability
// ---------------------------------------------------------------------------

model Metric {
  id                   String   @id @default(uuid())
  resourceId           String
  timestamp            DateTime @default(now())
  
  // Utilization Metrics
  cpuUsage             Float    // 0.0 to 100.0 percent
  memoryUsage          Float    // 0.0 to 100.0 percent
  networkIn            Float    // MB/s
  networkOut           Float    // MB/s
  storageUsedBytes     Float?   // Actual bytes consumed
  storageTotalBytes    Float?   // Total bytes allocated
  
  // Application Performance
  latency              Float    // Average latency in ms
  latencyP95           Float?   // 95th percentile latency in ms
  requests             Int      // Requests per minute
  errorRate            Float    @default(0.0) // 0.0 to 100.0 percent
  
  // Observability Quality
  uptimeProbesSuccess  Int      @default(1)
  uptimeProbesTotal    Int      @default(1)
  coveragePercent      Float    @default(100.0) // Sample completeness
  
  resource             Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)

  @@index([resourceId, timestamp])
}

// ---------------------------------------------------------------------------
// Recommendations & Governance Policies
// ---------------------------------------------------------------------------

model ScalingRecommendation {
  id                  String   @id @default(uuid())
  resourceId          String
  type                String   // "SCALE_UP", "SCALE_DOWN", "RIGHTSIZE", "IDLE_CLEANUP"
  basisMethod         String   @default("RULE_BASED") // "RULE_BASED", "STATISTICAL", "FORECAST_ASSISTED"
  reason              String   // Plain-language operational rationale
  evidenceWindow      String   // JSON string: { "windowMinutes": 10, "trafficDelta": 34, "cpuAvg": 82 }
  evidenceQuality     String   @default("HIGH") // "HIGH", "MODERATE", "INSUFFICIENT"
  
  currentCapacity     Int
  recommendedCapacity Int
  estimatedCostChange Float    // Monthly difference (+ for increase, - for savings)
  remainingPeriodDelta Float   @default(0.0) // Incremental impact on active billing period
  
  confidence          Float    // 0.0 to 100.0 percentage
  urgency             String   @default("MEDIUM") // "CRITICAL", "HIGH", "MEDIUM", "LOW"
  status              String   @default("ACTIVE") // "ACTIVE", "SNOOZED", "DISMISSED", "EXPIRED", "APPLIED"
  snoozedUntil        DateTime?
  dismissReason       String?
  expiresAt           DateTime
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  resource            Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
}

model Policy {
  id                  String    @id @default(uuid())
  workspaceId         String
  name                String
  scopeType           String    @default("WORKSPACE") // "WORKSPACE", "ACCOUNT", "ENVIRONMENT", "SERVICE", "RESOURCE"
  scopeTargetId       String?   // ID of the target service, resource, or environment name
  
  // Guardrails
  minInstanceCount    Int       @default(1)
  maxInstanceCount    Int       @default(10)
  maxStepSize         Int       @default(2) // Max replicas allowed per single scaling operation
  cooldownMinutes     Int       @default(5) // Cooldown period before another action can occur
  allowedActions      String    @default("SCALE_UP,SCALE_DOWN,RESTART") // Comma-separated list
  
  // Approval Constraints
  requireApproval     Boolean   @default(true)
  requireSeparateAdmin Boolean  @default(true) // Requester cannot approve their own change
  
  // Budget Linking
  linkedBudgetId      String?
  enabled             Boolean   @default(true)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  workspace           Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  linkedBudget        Budget?   @relation(fields: [linkedBudgetId], references: [id], onDelete: SetNull)
}

// ---------------------------------------------------------------------------
// Changes, Approvals & Operations Execution
// ---------------------------------------------------------------------------

model ChangeRequest {
  id                   String            @id @default(uuid())
  workspaceId          String
  requesterId          String
  approverId           String?
  serviceId            String?
  resourceId           String
  
  actionType           String            // "SCALE_CAPACITY", "RESTART_SERVICE"
  source               String            @default("MANUAL") // "MANUAL", "RECOMMENDATION", "COPILOT_DRAFT"
  sourceRecommendationId String?
  
  // Versioning & Snapshot
  targetVersion        Int               // Resource version at preview time (optimistic lock)
  currentAllocation    Int
  proposedAllocation   Int
  
  // Financial Snapshot (Evaluated deterministically at preview creation)
  monthlyRateDelta     Float             // Monthly run-rate difference
  periodCostDelta      Float             // Remaining billing period impact
  budgetHeadroomAfter  Float             // Remaining headroom after change
  pricingBasisHours    Int               @default(730)
  remainingPeriodHours Int               @default(365)
  currency             String            @default("INR")
  
  // Policy & Approval Verification
  policyChecksJson     String            // JSON: { "capacityPass": true, "budgetPass": true, "cooldownPass": true }
  status               String            @default("AWAITING_APPROVAL") // "AWAITING_APPROVAL", "APPROVED", "REJECTED", "EXPIRED", "CANCELLED"
  changeNote           String?
  rejectionReason      String?
  previewExpiresAt     DateTime          // Executable preview valid for 5 minutes
  
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt

  workspace            Workspace         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  requester            User              @relation("RequesterRelation", fields: [requesterId], references: [id], onDelete: Restrict)
  approver             User?             @relation("ApproverRelation", fields: [approverId], references: [id], onDelete: SetNull)
  service              Service?          @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  resource             Resource          @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  operation            ChangeOperation?
}

model ChangeOperation {
  id                  String        @id @default(uuid())
  changeRequestId     String        @unique
  idempotencyKey      String        @unique
  status              String        @default("QUEUED") // "QUEUED", "RUNNING", "RECONCILING", "SUCCEEDED", "FAILED", "CANCELLED"
  
  // Provider Execution Audit
  providerOperationId String?       // Provider's task or activity ID (e.g. AWS AutoScaling ActivityId)
  observedBeforeState String?       // JSON snapshot of resource prior to mutation
  observedAfterState  String?       // JSON snapshot of resource after provider confirmation
  failureDetails      String?       // Human-readable failure diagnostics
  retryCount          Int           @default(0)
  
  startedAt           DateTime?
  completedAt         DateTime?
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  changeRequest       ChangeRequest @relation(fields: [changeRequestId], references: [id], onDelete: Cascade)
}

// ---------------------------------------------------------------------------
// Costs, Budgets & Financial Accountability
// ---------------------------------------------------------------------------

model CostRecord {
  id             String       @id @default(uuid())
  cloudAccountId String
  service        String       // "EC2", "RDS", "S3", "Egress"
  environment    String?      // "PRODUCTION", "STAGING"
  date           DateTime     // Incurred billing date
  cost           Float        // Incurred monetary amount
  currency       String       @default("INR")
  usageQuantity  Float?
  usageUnit      String?      // "GB-month", "Hours"
  isFinalized    Boolean      @default(false) // Finalized invoice vs interim reported usage
  isUnattributed Boolean      @default(false) // Costs without service tags

  cloudAccount   CloudAccount @relation(fields: [cloudAccountId], references: [id], onDelete: Cascade)

  @@index([cloudAccountId, date])
}

model Budget {
  id                  String    @id @default(uuid())
  workspaceId         String
  name                String
  period              String    @default("MONTHLY") // "MONTHLY", "QUARTERLY"
  amount              Float     // Hard limit
  currency            String    @default("INR")
  warningThresholdPct Float     @default(80.0) // Alert at 80%
  hardEnforce         Boolean   @default(true) // Block changes that exceed budget
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  workspace           Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  linkedPolicies      Policy[]
}

// ---------------------------------------------------------------------------
// AI Copilot, Conversations & Verifiable Citations
// ---------------------------------------------------------------------------

model CopilotThread {
  id          String           @id @default(uuid())
  workspaceId String
  userId      String
  title       String
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  workspace   Workspace        @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages    CopilotMessage[]
}

model CopilotMessage {
  id              String            @id @default(uuid())
  threadId        String
  role            String            // "USER", "ASSISTANT", "SYSTEM"
  content         String            // Markdown formatted response text
  structuredDraft String?           // Optional JSON draft for ChangeReview flow
  
  // Model Telemetry & Audit
  modelIdentifier String?           // "gemini-2.0-flash", "claude-3-5-sonnet"
  tokensPrompt    Int               @default(0)
  tokensCompletion Int              @default(0)
  estimatedCost   Float             @default(0.0) // In USD
  createdAt       DateTime          @default(now())

  thread          CopilotThread     @relation(fields: [threadId], references: [id], onDelete: Cascade)
  citations       CopilotCitation[]
}

model CopilotCitation {
  id               String         @id @default(uuid())
  messageId        String
  citationNumber   Int            // [1], [2], etc.
  sourceType       String         // "METRIC_WINDOW", "PRICING_CATALOG", "POLICY_RULE", "AUDIT_RECORD", "DOCUMENT"
  referenceId      String         // ID of the referenced DB record
  label            String         // Display label (e.g. "Traffic & CPU Window (10m)")
  snapshotJson     String         // Immutable JSON capture of the data evaluated
  createdAt        DateTime       @default(now())

  message          CopilotMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
}

// ---------------------------------------------------------------------------
// Runbooks, Documents & Notifications
// ---------------------------------------------------------------------------

model KnowledgeDocument {
  id          String    @id @default(uuid())
  workspaceId String
  title       String
  category    String    // "RUNBOOK", "POST_MORTEM", "ARCHITECTURE_DOC"
  content     String
  version     Int       @default(1)
  embeddingId String?   // Vector index reference
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model Notification {
  id          String    @id @default(uuid())
  workspaceId String
  userId      String?   // Nullable for workspace-wide broadcasts
  severity    String    @default("INFO") // "INFO", "WARNING", "CRITICAL", "SUCCESS"
  title       String
  message     String
  linkUrl     String?
  isRead      Boolean   @default(false)
  createdAt   DateTime  @default(now())

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id          String    @id @default(uuid())
  workspaceId String?
  userId      String?
  action      String    // e.g. "SCALE_RESOURCE", "APPROVE_CHANGE", "CREATE_POLICY", "USER_LOGIN"
  targetType  String?   // "RESOURCE", "POLICY", "BUDGET", "WORKSPACE"
  targetId    String?
  source      String    @default("MANUAL") // "MANUAL", "RECOMMENDATION", "COPILOT_DRAFT"
  details     String    // JSON string describing the event diff and context
  ipAddress   String?
  outcome     String    @default("SUCCESS") // "SUCCESS", "FAILURE", "BLOCKED"
  createdAt   DateTime  @default(now())

  workspace   Workspace? @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User?      @relation(fields: [userId], references: [id], onDelete: SetNull)
}
```

---

## 5. Pluggable Cloud Provider Abstraction Contract

The platform interacts with heterogeneous cloud infrastructure through an extensible provider interface: `CloudProvider`. All cloud-specific nuances (ARN structures, API throttles, pagination tokens) are converted into normalized platform domain entities.

### 5.1 Provider Base Interface (`CloudProvider.js`)

```javascript
/**
 * Abstract Base Class: CloudProvider
 * Every cloud adapter (AWS, Azure, GCP, Mock) must implement this interface.
 */
export class CloudProvider {
  constructor(accountConfig) {
    if (new.target === CloudProvider) {
      throw new TypeError("Cannot construct CloudProvider instances directly.");
    }
    this.accountId = accountConfig.accountId;
    this.region = accountConfig.region;
    this.credentials = accountConfig.credentials;
  }

  /**
   * Validates account connectivity and read/write permissions.
   * @returns {Promise<{ valid: boolean, capabilities: string[], errors?: string[] }>}
   */
  async validateConnection() {
    throw new Error("Method 'validateConnection()' must be implemented.");
  }

  /**
   * Discovers and syncs resources for this cloud account.
   * @returns {Promise<Array<DiscoveredResource>>}
   */
  async discoverResources() {
    throw new Error("Method 'discoverResources()' must be implemented.");
  }

  /**
   * Fetches latest metrics for a set of resource identifiers within a time range.
   * @param {string[]} resourceIds
   * @param {Date} startTime
   * @param {Date} endTime
   * @returns {Promise<Array<MetricSample>>}
   */
  async getMetrics(resourceIds, startTime, endTime) {
    throw new Error("Method 'getMetrics()' must be implemented.");
  }

  /**
   * Retrieves incurred cost and usage records broken down by service and day.
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Array<ProviderCostEntry>>}
   */
  async getCostHistory(startDate, endDate) {
    throw new Error("Method 'getCostHistory()' must be implemented.");
  }

  /**
   * Executes a capacity scaling action on the specified target resource.
   * @param {string} targetResourceId
   * @param {number} desiredCapacity
   * @param {string} idempotencyToken
   * @returns {Promise<{ operationId: string, status: 'QUEUED' | 'RUNNING' | 'CONFIRMED' }>}
   */
  async scaleResource(targetResourceId, desiredCapacity, idempotencyToken) {
    throw new Error("Method 'scaleResource()' must be implemented.");
  }

  /**
   * Reconciles current observed cloud state against desired configuration.
   * @param {string} targetResourceId
   * @param {string} operationId
   * @returns {Promise<{ confirmedCapacity: number, status: 'CONFIRMED' | 'IN_PROGRESS' | 'FAILED' }>}
   */
  async reconcileOperation(targetResourceId, operationId) {
    throw new Error("Method 'reconcileOperation()' must be implemented.");
  }
}
```

### 5.2 Provider Implementation Roadmap

1. **`MockCloudProvider` (R1 - MVP Foundation)**:
   - High-fidelity synthetic multi-cloud environment (AWS Mumbai, Azure Singapore, GCP Frankfurt).
   - Generates realistic diurnal sinusoidal telemetry with stochastic traffic spikes (Journey A scenario: +34% traffic surge, 82% CPU).
   - Simulates provider execution latency (800ms–2000ms), rate limiting, and ambiguous timeout scenarios for testing reconciliation.
2. **`AWSCloudProvider` (R2 - Live AWS Beta)**:
   - `@aws-sdk/client-auto-scaling`: `DescribeAutoScalingGroups`, `SetDesiredCapacity`, `DescribeScalingActivities`.
   - `@aws-sdk/client-cloudwatch`: `GetMetricData` for `CPUUtilization`, `RequestCount`, `TargetResponseTime`.
   - `@aws-sdk/client-cost-explorer`: `GetCostAndUsage` for amortized daily service costs.
3. **`AzureCloudProvider` & `GCPCloudProvider` (R3 - Multi-Cloud Expansion)**:
   - Azure VM Scale Sets (`ComputeManagementClient`), Azure Monitor Metrics, Azure Cost Management API.
   - GCP Compute Engine Managed Instance Groups (`InstanceGroupManagersClient`), Cloud Monitoring, Cloud Billing API.

---

## 6. Deterministic Domain Engines & Algorithms

All operational decisions and financial projections are governed by deterministic algorithms.

### 6.1 Capacity Scaling Formula

When evaluating capacity adjustment for a CPU-bound service:

$$\text{Proposed Replicas} = \left\lceil \text{Current Replicas} \times \frac{\text{Observed Average CPU}}{\text{Target CPU}} \right\rceil$$

- Default Target CPU: $60\%$
- Minimum Trigger Condition (Journey A):
  - 10-minute traffic moving average $\ge +30\%$ over preceding 10-minute window.
  - Observed CPU $> 75\%$ OR valid $p95$ Latency $>$ configured threshold.
  - Baseline traffic $\ge 100\text{ req/min}$.
  - Data coverage in observation window $\ge 80\%$.
- Resulting proposed replicas are then bounded by policy:
  $$\text{Effective Proposed} = \max(\text{Policy.min}, \min(\text{Policy.max}, \text{Current} \pm \text{Policy.maxStep}))$$

### 6.2 Financial & Run-Rate Formulation

- Standardized Month Duration: $730\text{ hours}$.
- Unit Hourly Price: Derived from cloud account catalog or configured standard pricing.
- **Monthly Run-Rate**:
  $$\text{Monthly Run-Rate} = \text{Replicas} \times \text{Unit Hourly Cost} \times 730$$
- **Remaining Period Incremental Impact**:
  $$\Delta \text{Period Cost} = (\text{Proposed Replicas} - \text{Current Replicas}) \times \text{Unit Hourly Cost} \times \text{Remaining Hours in Billing Period}$$
- **Projected Month-End Spend**:
  $$\text{Projected Spend} = \text{Incurred MTD Spend} + \text{Remaining Period Forecast} + \Delta \text{Period Cost}$$
- **Budget Headroom**:
  $$\text{Headroom} = \text{Budget Amount} - \text{Projected Spend} - \text{Outstanding Commitments}$$

### 6.3 Multi-Policy Intersection Algorithm

When multiple policies target a resource (e.g., Workspace-wide + Service-specific + Resource-level):
1. **Capacity Bounds**: Narrowest range $\rightarrow \max(\text{all minCapacity}) \text{ to } \min(\text{all maxCapacity})$.
2. **Step Size**: Strictest limit $\rightarrow \min(\text{all maxStepSize})$.
3. **Cooldown**: Longest window $\rightarrow \max(\text{all cooldownMinutes})$.
4. **Approval Gate**: Logical OR $\rightarrow$ If *any* matching active policy requires approval, approval is enforced.
5. **Separate Approver**: Logical OR $\rightarrow$ If *any* matching active policy requires a separate Admin, self-approval is blocked.

### 6.4 Durable Operation State Machine

```mermaid
stateDiagram-v2
    [*] --> AWAITING_APPROVAL : Operator/AI submits proposal
    AWAITING_APPROVAL --> REJECTED : Admin rejects proposal
    AWAITING_APPROVAL --> EXPIRED : 15-minute preview window elapses
    AWAITING_APPROVAL --> APPROVED : Authorized Admin approves
    
    APPROVED --> QUEUED : Dispatched to execution worker
    QUEUED --> RUNNING : Worker claims task with idempotency key
    
    RUNNING --> SUCCEEDED : Provider confirms configuration
    RUNNING --> RECONCILING : Provider timeout or ambiguous response
    
    RECONCILING --> SUCCEEDED : Poll confirms desired state active
    RECONCILING --> FAILED : Poll confirms failed / reverted state
    
    SUCCEEDED --> [*] : Audit logged & notifications sent
    FAILED --> [*] : Error alert raised; state preserved
```

---

## 7. AI Operations Copilot Architecture & Tool Contracts

The AI Operations Copilot operates as a sandboxed intelligence assistant with strictly typed, read-only tools. It grounds every response in authorized workspace records and emits deterministic structured citations.

```mermaid
sequenceDiagram
    autonumber
    actor User as Operator / Admin
    participant UI as Copilot Panel (Frontend)
    participant API as Copilot Gateway (/api/copilot)
    participant Auth as Workspace Guard
    participant LLM as LLM Agent (Gemini / Bedrock)
    participant Tools as Deterministic Tool Suite
    participant DB as CloudOps Prisma Database

    User->>UI: "Why should we increase Production API capacity?"
    UI->>API: POST /api/copilot/chat { threadId, prompt, context }
    API->>Auth: Validate user workspace membership & token budget
    Auth-->>API: Authorized
    
    API->>LLM: Send prompt + System Prompt + Available Tool Declarations
    LLM-->>API: Call Tool: get_service_metrics(service: "Production API", window: "10m")
    
    API->>Tools: Execute get_service_metrics(...)
    Tools->>DB: Query Metric (CPU, Traffic, Latency, Coverage)
    DB-->>Tools: Traffic +34%, CPU 82%, Latency 142ms, Coverage 98%
    Tools-->>API: Structured JSON Result [Citation Source #1, #2]
    
    API->>LLM: Send Tool Execution Result
    LLM-->>API: Call Tool: preview_scaling_impact(service: "Production API", targetCapacity: 6)
    
    API->>Tools: Execute preview_scaling_impact(...)
    Tools->>DB: Read Policy & Compute Pricing Formula
    Tools-->>API: Current: 4 (INR 16,800/mo), Proposed: 6 (INR 25,200/mo), ΔPeriod: +INR 4,200 [Citation Source #3, #4]
    
    API->>LLM: Send Tool Execution Result
    LLM-->>API: Final Response + Citation Indices + Structured Draft JSON
    API->>DB: Store CopilotMessage + CopilotCitation records
    API-->>UI: Stream Markdown text + Clickable [1] [2] Badges + Review Draft Card
    UI-->>User: Render cited answer & "Review draft" action button
```

### 7.1 Defined Tool Contracts

```typescript
// 1. Telemetry Inspection Tool
interface GetServiceMetricsInput {
  serviceId: string;
  windowMinutes: number; // e.g., 10, 60, 1440
}
interface GetServiceMetricsOutput {
  serviceName: string;
  timeRange: { start: string; end: string };
  trafficDeltaPercent: number;
  averageCpu: number;
  p95LatencyMs: number;
  sampleCoveragePercent: number;
  citationId: string;
}

// 2. Cost Breakdown Tool
interface GetCostBreakdownInput {
  timeRange: 'CURRENT_BILLING_PERIOD' | 'LAST_30_DAYS' | 'LAST_7_DAYS';
  groupBy: 'SERVICE' | 'PROVIDER' | 'RESOURCE';
}
interface GetCostBreakdownOutput {
  currency: string;
  totalIncurred: number;
  projectedMonthEnd: number;
  breakdown: Array<{ name: string; amount: number; percentage: number }>;
  citationId: string;
}

// 3. Deterministic Scaling Preview Tool
interface PreviewScalingImpactInput {
  resourceId: string;
  proposedCapacity: number;
}
interface PreviewScalingImpactOutput {
  resourceId: string;
  currentCapacity: number;
  proposedCapacity: number;
  monthlyRunRateDelta: number;
  remainingPeriodCostDelta: number;
  budgetHeadroomAfter: number;
  passesPolicies: boolean;
  requiresSeparateApproval: boolean;
  validationErrors: string[];
  previewExpiresAt: string;
  citationId: string;
}

// 4. Structured Draft Generator
interface DraftChangeProposalInput {
  resourceId: string;
  proposedCapacity: number;
  reason: string;
}
interface DraftChangeProposalOutput {
  isDraft: true;
  executable: false; // Non-executing draft; user must submit via ChangeReview drawer
  changeDraftId: string;
  summary: string;
}
```

### 7.2 Safety & Guardrails

- **Zero Direct Execution**: The LLM agent does not have access to any mutation endpoints (`scaleResource`, `deleteResource`, `updatePolicy`). All proposed actions output a structured non-executing JSON draft that mounts into the frontend `ChangeReview` workflow.
- **Tenant Scoping**: All tool executions filter strictly by the caller's authenticated `workspaceId`. A prompt containing cross-tenant resource IDs returns `404 Not Found`.
- **Token & Budget Caps**: Each workspace has an Admin-configured monthly AI spend cap (e.g., $50.00 USD). If the cap is reached, new LLM completions return HTTP 429 with an explicit notice, while normal dashboards and operations continue unimpeded.

---

## 8. Real-Time Telemetry & Event Streaming Pipeline

To provide live infrastructure visibility without client-side polling loops:

1. **Telemetry Ingestion & Simulation**:
   - The `MockCloudProvider` or live CloudWatch collector ingests metric samples at 10-second intervals.
   - Samples are persisted to the database via Prisma and pushed to the local Socket.IO telemetry emitter.
2. **WebSocket Room Multiplexing**:
   - Clients connect over Socket.IO and authenticate using their JWT.
   - The server assigns sockets to rooms based on authorized workspace and selected services:
     `workspace:${workspaceId}:metrics` and `workspace:${workspaceId}:operations`.
3. **Telemetry Packet Contract**:
   ```json
   {
     "event": "telemetry:sample",
     "data": {
       "resourceId": "c4d3b841-3b7d-4191-8bb6-ef8b5c9281a4",
       "timestamp": "2026-09-19T16:30:00.000Z",
       "cpuUsage": 82.4,
       "memoryUsage": 74.1,
       "networkIn": 45.2,
       "networkOut": 88.6,
       "latency": 138.2,
       "latencyP95": 182.0,
       "requests": 24200,
       "coveragePercent": 100.0
     }
   }
   ```
4. **Operation Progress Event Contract**:
   ```json
   {
     "event": "operation:status",
     "data": {
       "operationId": "op_9f81a7b",
       "changeRequestId": "cr_182bc4",
       "resourceId": "c4d3b841-3b7d-4191-8bb6-ef8b5c9281a4",
       "status": "RECONCILING",
       "progressPercent": 65,
       "message": "Awaiting CloudWatch probe confirmation of active ASG instances..."
     }
   }
   ```

---

## 9. API Surface Specification

All HTTP endpoints are prefixed with `/api` and return standardized JSON responses:
`{ "success": boolean, "data"?: any, "error"?: { "message": string, "code": string } }`.

### 9.1 Authentication & Workspace Management

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create new account and initialize primary workspace. |
| `POST` | `/api/auth/login` | Public | Authenticate with email/password; returns JWT + workspace list. |
| `GET` | `/api/auth/me` | Authenticated | Return authenticated profile, current workspace, and role. |
| `POST` | `/api/auth/switch-workspace`| Authenticated | Switch active workspace context; issues refreshed JWT. |
| `GET` | `/api/workspaces/:slug` | Workspace Member | Retrieve workspace metadata, currency, and AI budget status. |

### 9.2 Resources, Inventory & Telemetry

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/resources` | Workspace Member | List resources filtered by cloud, region, service, status. |
| `GET` | `/api/resources/:id` | Workspace Member | Detailed resource specifications, metrics history, linked policy. |
| `GET` | `/api/metrics` | Workspace Member | Time-series query for metrics with window, aggregation, and step. |
| `GET` | `/api/dashboard/overview` | Workspace Member | Aggregated KPI stats, attention banner, health distribution. |

### 9.3 Recommendations, Policies & Governance

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/scaling/recommendations`| Workspace Member | Active scaling, rightsizing, and cost optimization opportunities. |
| `POST` | `/api/scaling/recommendations/:id/dismiss` | Operator / Admin | Snooze or dismiss a recommendation with reason. |
| `GET` | `/api/policies` | Workspace Member | List active governance policies and linked budget thresholds. |
| `POST` | `/api/policies` | Admin | Create or update scoped guardrails (min/max capacity, step, approval). |
| `DELETE` | `/api/policies/:id` | Admin | Decommission an existing policy. |

### 9.4 Changes, Approvals & Operations

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/scaling/preview` | Workspace Member | Compute deterministic what-if pricing and policy checks (5m validity). |
| `POST` | `/api/scaling/requests` | Operator / Admin | Submit a verified preview for approval or immediate execution. |
| `GET` | `/api/changes` | Workspace Member | Changes inbox: Awaiting approval, In progress, and History. |
| `POST` | `/api/changes/:id/approve` | Admin (Separate) | Approve change request and queue execution worker. |
| `POST` | `/api/changes/:id/reject` | Admin | Reject change request with operational feedback note. |
| `POST` | `/api/changes/:id/cancel` | Requester / Admin | Cancel unstarted request prior to worker claim. |
| `GET` | `/api/changes/:id/operations` | Workspace Member | Inspect execution timeline, provider ID, and observed state diff. |

### 9.5 Costs, Billing & Budgets

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/costs/summary` | Workspace Member | Month-to-date spend, projected month-end, budget headroom, savings. |
| `GET` | `/api/costs/breakdown` | Workspace Member | Cost breakdown grouped by provider, service, account, or environment. |
| `GET` | `/api/costs/budgets` | Workspace Member | Scoped budget allocations, warning thresholds, and current posture. |
| `POST` | `/api/costs/budgets` | Admin | Define new monthly/quarterly financial budget. |
| `GET` | `/api/costs/export` | Workspace Member | Export scoped cost data as RFC 4180 compliant CSV. |

### 9.6 AI Copilot & Knowledge

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/copilot/chat` | Workspace Member | Submit query to Copilot; streams attributable answer and citations. |
| `GET` | `/api/copilot/threads` | Workspace Member | List user's private investigation threads in this workspace. |
| `GET` | `/api/copilot/threads/:id` | Workspace Member | Load full conversation history with structured citations. |
| `POST` | `/api/copilot/brief` | Workspace Member | Generate on-demand 3-bullet executive operational summary. |
| `POST` | `/api/copilot/feedback` | Workspace Member | Record helpful/unhelpful rating for model evaluation corpus. |

---

## 10. Security, Tenancy & Compliance Architecture

### 10.1 Multi-Tenant Authorization Model

CloudOps enforces strict tenant isolation using a tenant-scoping middleware that binds every incoming request to an authenticated `workspaceId`.

```mermaid
flowchart LR
    Request[HTTP / WS Request] --> JWTVerify[JWT Authentication & Expiry]
    JWTVerify --> ExtractClaims[Extract UserId & Active WorkspaceId]
    ExtractClaims --> DBCheck[Verify WorkspaceMembership & Role]
    DBCheck -->|Not Member| Deny[403 Forbidden]
    DBCheck -->|Valid Role| ScopeInjection[Inject Scoped Prisma Extension]
    ScopeInjection --> RouteHandler[Controller Execution]
```

- **Database-Level Tenant Scoping**: Prisma query extensions automatically append `where: { workspaceId }` to every relational lookup.
- **Cross-Tenant Attack Mitigation**: Attempts to query or mutate an entity belonging to Workspace B with a token for Workspace A fail with `404 Not Found` to prevent entity enumeration.

### 10.2 Role-Based Access Control (RBAC) Matrix

| Capability | Viewer | Operator | Admin |
| --- | :---: | :---: | :---: |
| Inspect Dashboards, Metrics, Costs & Audit Logs | Yes | Yes | Yes |
| Run What-If Scaling Previews | Yes | Yes | Yes |
| Interact with AI Copilot | Yes | Yes | Yes |
| Submit Scaling / Restart Requests | No | Yes | Yes |
| Snooze / Dismiss Recommendations | No | Yes | Yes |
| Approve / Reject Changes | No | No | Yes |
| Manage Policies & Budgets | No | No | Yes |
| Connect Cloud Accounts & Manage Users | No | No | Yes |
| Configure AI Limits & Workspace Settings | No | No | Yes |

*Enforcement*: Controlled via Express middleware `requireRole(['ADMIN', 'OPERATOR'])`.

### 10.3 Separate Approver Security Rule

For production environments, the system strictly enforces the **Two-Person Rule**:
- The user who created the `ChangeRequest` (`requesterId`) cannot be the user who approves the change (`approverId`).
- If an Admin requests a change in a production-scoped service, another Admin must review and approve it.
- In single-user demo workspaces, this constraint can be toggled via `Workspace.isDemo = true`.

### 10.4 Append-Only Audit Logging

All security-sensitive operations (logins, role changes, policy updates, scaling approvals, and cloud mutations) write an immutable record to the `AuditLog` table.
- Logs include: `timestamp`, `actorId`, `action`, `targetType`, `targetId`, `source`, `policyVersion`, `pricingVersion`, and complete before/after state diffs.
- Audit records cannot be updated or deleted through the platform API.

---

## 11. Environment Configuration & Secrets Management

Configuration parameters are declared via environment variables with strict validation on server boot:

```ini
# ==============================================================================
# CloudOps Core Server Configuration
# ==============================================================================
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database Connection (SQLite in local dev, PostgreSQL in staging/production)
DATABASE_URL="file:./prisma/dev.db"
# DATABASE_URL="postgresql://cloudops_user:securepass@localhost:5432/cloudops?schema=public"

# Authentication Secrets
JWT_SECRET=super-secure-jwt-secret-for-cloudops-enterprise-auth
JWT_EXPIRES_IN=8h

# AI Copilot Provider (Gemini / OpenAI / Anthropic / Mock)
AI_PROVIDER=gemini
GEMINI_API_KEY=your-google-ai-studio-api-key
OPENAI_API_KEY=optional-openai-api-key
ANTHROPIC_API_KEY=optional-anthropic-api-key

# Live Cloud Integrations (Optional for R1, Required for R2/R3)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=optional-aws-access-key
AWS_SECRET_ACCESS_KEY=optional-aws-secret-key

# Telemetry Simulation Parameters
ENABLE_TELEMETRY_SIMULATOR=true
TELEMETRY_INTERVAL_MS=10000
```

---

## 12. Phased Delivery Roadmap & Definition of Done

Following the specifications in [PRD.md](PRD.md):

```mermaid
gantt
    title CloudOps Platform Delivery Roadmap
    dateFormat  YYYY-MM-DD
    section R1 — AI-Assisted MVP
    Workspace Identity & Prisma Schema         :done,    r1_1, 2026-09-01, 2026-09-05
    Pluggable Cloud Engine & Mock Provider     :done,    r1_2, 2026-09-05, 2026-09-10
    Telemetry Streaming & Dashboard UI         :active,  r1_3, 2026-09-10, 2026-09-15
    Deterministic Pricing & Change Review      :active,  r1_4, 2026-09-15, 2026-09-20
    Real LLM Copilot & Attributable Citations  :active,  r1_5, 2026-09-20, 2026-09-25
    Acceptance Gate: Journeys A-D Validation   :         r1_6, 2026-09-25, 2026-09-30
    
    section R2 — Live AWS Beta
    Live AWS SDK Integration (ASG, CloudWatch) :         r2_1, 2026-10-01, 2026-10-15
    Billing Reconciliation & Cost Explorer     :         r2_2, 2026-10-15, 2026-10-25
    Statistical Forecasts & Backtesting        :         r2_3, 2026-10-25, 2026-11-05
    Runbook Retrieval & Document Search        :         r2_4, 2026-11-05, 2026-11-15
    Acceptance Gate: Journey E & Live Mutation :         r2_5, 2026-11-15, 2026-11-20

    section R3 — Multi-Cloud & Automation
    Azure ARM & GCP Compute Provider Adapters  :         r3_1, 2026-11-20, 2026-12-10
    Cross-Cloud Cost Arbitrage & Comparisons   :         r3_2, 2026-12-10, 2026-12-25
    Policy-Authorized Automated Scaling        :         r3_3, 2026-12-25, 2027-01-10
```

### Definition of Done by Release

- **R1 Gate (AI-Assisted MVP)**:
  - All end-to-end acceptance Journeys A–D in [PRD.md](PRD.md) pass without manual intervention.
  - Multi-cloud simulation engine reproduces Journey A surge scenario (+34% traffic, 82% CPU) reliably.
  - AI Copilot answers operational queries using verified live LLM tool calls with clickable citation badges.
  - Separate approver enforcement blocks self-approval on production change requests.
  - Responsive client layouts verified across 360px, 768px, 1280px, and 1536px breakpoints.
- **R2 Gate (Live AWS Beta)**:
  - Validated live AWS read/write integration for EC2 Auto Scaling groups and CloudWatch metrics.
  - Incurred billing reconciled against AWS Cost Explorer API.
  - Demand forecasting algorithm evaluated on $\ge 28$ days of hourly telemetry with backtest verification.
  - Database recovery exercise demonstrates RPO $\le 15$ minutes and RTO $\le 4$ hours.
- **R3 Gate (Multi-Cloud & Bounded Automation)**:
  - Consistent abstraction and execution parity across AWS, Azure, and GCP.
  - Scheduled and predictive scaling triggers execute within strict policy guardrails and audit logs.

---

## 13. Companion Document Traceability

| Requirement Area | PRD.md Section | DESIGN.md Section | TECH_STACK.md Section |
| --- | --- | --- | --- |
| **Workspace & Multi-Tenancy** | FR-01 (§5) | Public routes & Shell (§3, §5) | §4 Data Model, §10 Security |
| **Inventory & Mappings** | FR-02 (§5) | Resources & Detail (§6.2, §6.3) | §4 Schema, §5 CloudProvider |
| **Command Center Overview** | FR-03 (§5) | Overview Structure (§6.1) | §3 Frontend Matrix, §9 APIs |
| **Telemetry & Metrics** | FR-04 (§5) | Monitoring Screens (§6.4) | §5 CloudProvider, §8 WebSocket |
| **Recommendations Engine** | FR-05 (§5) | Recommendations Screen (§6.5) | §4 Schema, §6 Algorithms |
| **AI Copilot & Attributability** | FR-06, FR-07 (§5) | Copilot Panel & Citations (§6.10)| §7 AI Architecture & Tools |
| **Change Review & Scaling** | FR-09 (§5) | Shared Change Review (§6.6) | §4 Schema, §6.4 State Machine |
| **Governance Policies** | FR-10 (§5) | Policies Screen (§6.9) | §4 Schema, §6.3 Intersection |
| **Costs & Budgets** | FR-11, FR-12 (§5) | Costs & Billing Workspace (§6.8)| §4 Schema, §6.2 Formulations |
| **Audit & Change Timeline** | FR-13 (§5) | Changes & Audit Logs (§6.7, §6.11)| §4 Schema, §10.4 Audit Model |
| **Execution Worker & Recovery** | FR-09, FR-13 (§5)| Operation Timeline (§6.7, §7) | §6.4 Worker, §12 Roadmap |

# CloudOps — Unified Cloud Resource, Telemetry & Cost Governance Platform

**CloudOps** is an enterprise-grade cloud management platform that unifies multi-cloud infrastructure monitoring, autonomous workload scaling, governance policies, and cost management into a single control plane.

Designed as a production-ready hackathon foundation, it provides a pluggable cloud provider architecture (`CloudProvider` interface) ready for AWS, Azure, and Google Cloud SDKs, backed by realistic telemetry simulation, SQLite + Prisma ORM, JWT authentication with Role-Based Access Control (RBAC), and a responsive React frontend.

---

## 🎨 Enterprise UI/UX Design System
- **Theme Palette**:
  - **Primary**: `#0F172A` (Slate 900)
  - **Accent**: `#2563EB` (Blue 600)
  - **Background**: `#F8FAFC` (Slate 50)
  - **Cards & Surfaces**: `#FFFFFF` (White)
  - **Borders & Dividers**: `#E2E8F0` (Slate 200)
- **Typography**: Inter & JetBrains Mono (Google Fonts)
- **Visuals**: Clean data tables, interactive Recharts graphs, status indicators, and modal workflows.

---

## 🏗️ Architecture & Project Structure

```
CloudOps/
├── client/                     # Frontend (React 18, Vite, Tailwind CSS, Recharts)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Button, Card, Badge, Modal, Input, Select, StatCard, etc.
│   │   │   ├── charts/         # TelemetryChart, CostBreakdownChart, CostTrendChart
│   │   │   ├── resources/      # ScaleResourceModal, ResourceDetailModal
│   │   │   └── layout/         # Sidebar, TopBar, DashboardLayout
│   │   ├── pages/              # 10 Routes: Login, Register, Dashboard, Resources,
│   │   │                       # Monitoring, Scaling, Costs, Policies, AuditLogs, Settings
│   │   ├── layouts/            # DashboardLayout (Protected shell)
│   │   ├── hooks/              # useAuth, useCloudFilter, useSocket
│   │   ├── services/           # Axios API services with JWT auto-injection
│   │   └── utils/              # Formatters, constants, role configs
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── server/                     # Backend (Node.js, Express, Socket.IO, Prisma ORM, SQLite)
    ├── prisma/
    │   ├── schema.prisma       # 8 Relational Models
    │   ├── seed.js             # Multi-cloud demo seed data (7 days historical metrics)
    │   └── dev.db              # SQLite Database
    ├── src/
    │   ├── controllers/        # Auth, Resources, Metrics, Scaling, Costs, Policies, Audit
    │   ├── routes/             # REST API Endpoints
    │   ├── services/           # Socket.IO & Telemetry broadcasting
    │   ├── middleware/         # JWT Auth, RBAC ('ADMIN', 'OPERATOR', 'VIEWER'), ErrorHandler
    │   ├── models/             # Prisma client instance
    │   ├── providers/          # Pluggable Cloud Provider Abstraction
    │   │   ├── CloudProvider.js      # Base interface
    │   │   ├── MockCloudProvider.js  # Multi-cloud simulation engine
    │   │   ├── AWSCloudProvider.js   # AWS SDK extension stub
    │   │   ├── AzureCloudProvider.js # Azure SDK extension stub
    │   │   └── GCPCloudProvider.js   # GCP SDK extension stub
    │   ├── utils/              # JWT, Logger, helpers
    │   ├── app.js              # Express app
    │   └── server.js           # HTTP + WebSocket Server Entrypoint
    └── test_apis.js            # Automated verification test suite
```

---

## 👥 Demo User Accounts & Roles

The platform is seeded with 3 demo accounts featuring **1-Click Login** on the login page:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@cloudops.dev` | `cloudops123` | Full access: View all, scale workloads, manage governance policies, sync accounts |
| **OPERATOR** | `operator@cloudops.dev` | `cloudops123` | View all dashboards, scale workloads within policy limits, restart resources |
| **VIEWER** | `viewer@cloudops.dev` | `cloudops123` | Read-only access to metrics, financial reports, and dashboards |

*You can also switch roles on the fly using the **"Switch Role"** menu in the top bar.*

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

---

### 2. Backend Setup & Database Initialization

```bash
# Navigate to the server directory
cd server

# 1. Install dependencies
npm install

# 2. Synchronize Prisma schema with SQLite
npx prisma db push

# 3. Seed database with realistic multi-cloud resources & 7 days of metrics
node prisma/seed.js

# 4. (Optional) Run automated API verification tests
node test_apis.js

# 5. Start the backend server
npm start
# -> Backend runs on http://localhost:5000 (REST APIs & Socket.IO)
```

---

### 3. Frontend Setup

```bash
# In a new terminal window, navigate to the client directory
cd client

# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev
# -> Frontend runs on http://localhost:5173
```

Now open **http://localhost:5173** in your browser and click any of the 1-Click Demo Logins to explore!

---

## 🌐 Complete REST API Reference

All protected endpoints require the `Authorization: Bearer <JWT_TOKEN>` header.

### 🔐 Authentication
- `POST /api/auth/login` — Sign in with email & password, returns JWT token & user profile
- `POST /api/auth/register` — Register a new account with role assignment
- `GET /api/auth/me` — Get current user session
- `GET /api/auth/demo-accounts` — List demo accounts for rapid testing

### 📦 Resources & Inventory
- `GET /api/resources` — List all cloud resources (supports `?provider=`, `?region=`, `?status=`, `?search=`)
- `GET /api/resources/:id` — Get single resource specifications & 24h metrics
- `POST /api/resources/:id/scale` — Scale instance capacity (*Requires Operator or Admin*)
- `POST /api/resources/:id/restart` — Health probe & restart workload (*Requires Operator or Admin*)
- `POST /api/resources` — Provision new resource (*Requires Admin*)

### 📊 Telemetry & Metrics
- `GET /api/metrics/aggregated` — System-wide fleet CPU, Memory, Latency, and Requests timeline
- `GET /api/metrics/:resourceId?timeRange=24h` — Time-series telemetry (1h, 6h, 24h, 7d)

### ⚡ Autonomous Scaling & Optimization
- `GET /api/scaling/recommendations` — List pending rightsizing & scale recommendations
- `POST /api/scaling/apply/:id` — Apply recommendation (*Requires Operator or Admin*)
- `POST /api/scaling/dismiss/:id` — Dismiss recommendation

### 💰 Cost Governance
- `GET /api/costs/summary` — Monthly run-rate, end-of-month projection, and provider/service breakdown
- `GET /api/costs/records` — Detailed daily ingestion line items

### 🛡️ Policies & Guardrails
- `GET /api/policies` — List active governance policies
- `PATCH /api/policies/:id/toggle` — Toggle policy active status (*Requires Admin*)
- `POST /api/policies` — Create new policy rule (*Requires Admin*)
- `PUT /api/policies/:id` — Update policy (*Requires Admin*)
- `DELETE /api/policies/:id` — Delete policy (*Requires Admin*)

### 📜 Security & Audit Logs
- `GET /api/audit-logs` — Immutable audit trail with actor attribution and full payload inspection

### ☁️ Cloud Accounts
- `GET /api/accounts` — List connected AWS, Azure, and GCP accounts
- `POST /api/accounts/:id/sync` — Sync account connector health

---

## 🔌 Cloud Provider Abstraction Contract

To connect live cloud providers in the future:
1. Extend `CloudProvider` in `server/src/providers/`
2. Implement `getResources()`, `getResourceById()`, `getMetrics()`, `getCosts()`, `scaleResource()`, and `getServiceHealth()`
3. Plug the provider into `server/src/providers/index.js`

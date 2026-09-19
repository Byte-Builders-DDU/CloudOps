# CloudOps — Website and Frontend Design Specification

| Field | Value |
| --- | --- |
| Version | 2.0 — Greenfield experience |
| Date | 2026-09-19 |
| Status | Proposed design baseline |
| Product contract | [PRD.md](PRD.md) |
| Technical contract | [TECH_STACK.md](TECH_STACK.md) |

## 1. Experience vision

CloudOps should look and behave like a premium cloud operations workspace: clear, calm, information-rich, and easy to act on. The product combines a **service-health overview**, **financial decision tools**, and an **evidence-grounded AI Copilot** in one consistent interface.

The first screen should answer four questions:

1. Are our services healthy?
2. What requires attention now?
3. What change is recommended, and what will it cost?
4. Can I understand and perform that change with my permissions?

This document specifies the frontend to build from scratch. Layouts, routes, components, and interactions are target requirements. Release labels R1/R2/R3 follow [PRD.md](PRD.md).

### Experience principles

- **Service-first:** Lead with applications and their outcomes; expose underlying resource detail as users investigate.
- **Evidence before action:** Measurements, scope, price, and policy checks travel with every proposal.
- **AI in context:** Users can ask questions where they see a problem, while a full Copilot workspace supports deeper investigation.
- **Predictable controls:** Manual changes, recommendations, and AI drafts open the same review component.
- **Readable density:** Fit useful operational detail on screen with comfortable type, clear grouping, and restrained decoration.
- **Visible uncertainty:** Show stale data, partial coverage, estimates, predictions, and unsupported capabilities explicitly.
- **Progressive disclosure:** Show a useful summary first, followed by technical detail, evidence, and raw records on demand.

## 2. Brand and visual direction

### 2.1 Overall appearance

- Midnight-slate sidebar, soft off-white canvas, white cards, and cobalt primary actions.
- Fine borders, modest corner radii, and subtle elevation rather than heavy gradients.
- Violet accents identify AI entry points and generated explanations; health colors retain their operational meaning.
- Spacious section boundaries with compact, scannable tables inside them.
- Charts are functional and clearly labeled; illustrations are limited to onboarding, the product homepage, and useful empty states.
- Light theme is the R1 default. A fully tested dark content theme can follow in R3; the sidebar is dark from the start.

### 2.2 Color tokens

| Token | Value | Application |
| --- | --- | --- |
| `sidebar` / `text-primary` | `#0F172A` | Navigation surface and primary text on light backgrounds |
| `sidebar-deep` | `#020617` | Sidebar footer and subtle navigation contrast |
| `canvas` | `#F8FAFC` | Application background |
| `surface` | `#FFFFFF` | Cards, tables, menus, dialogs |
| `surface-muted` | `#F1F5F9` | Secondary panels and table headers |
| `border` | `#E2E8F0` | Card boundaries and dividers |
| `text-secondary` | `#475569` | Supporting descriptions |
| `text-muted` | `#64748B` | Timestamps and secondary labels |
| `primary` / hover | `#2563EB` / `#1D4ED8` | Main actions, active navigation, links |
| `ai` / tint | `#7C3AED` / `#F5F3FF` | Ask Copilot, AI briefs, generated explanation labels |
| `success` / tint | `#047857` / `#ECFDF5` | Healthy, verified success, estimated savings |
| `warning` / tint | `#B45309` / `#FFFBEB` | Warning, stale evidence, nearing budget |
| `critical` / tint | `#B91C1C` / `#FEF2F2` | Critical health, failed changes, blocked checks |

Provider identity can use AWS orange, Azure blue, and GCP blue alongside provider names/icons. Brand colors must not substitute for severity colors. Validate each foreground/background combination for accessible contrast.

### 2.3 Typography and spacing

- **Inter:** interface text, navigation, headings, forms.
- **JetBrains Mono:** identifiers, aligned financial figures, capacity comparisons, technical timestamps.
- Page headings: 26–30 px, semibold. Section headings: 18–20 px. Card headings: 16 px.
- Body, table cells, and actionable labels: 14 px by default. Secondary labels: 12–13 px.
- KPI figures: 28–34 px with tabular numerals. Units remain attached and readable.
- Use a 4 px spacing base: 4, 8, 12, 16, 20, 24, 32, 48.
- Desktop content padding: 24–32 px; mobile: 16 px. Card padding: 20–24 px.
- Cards: 12 px radius. Inputs/buttons: 8 px. Status badges: pill shape.
- Table rows: roughly 48–56 px. Primary touch targets: approximately 44 px.
- Transitions: 120–180 ms, with reduced-motion support. Telemetry should not cause constant page animation or flashing numbers.

### 2.4 Content style

Use concise headings and action labels: **Review change**, **Ask Copilot**, **View evidence**, **Request approval**, and **Approve and apply**.

Prefer “CPU averaged 82% over 10 minutes” to an unsupported statement such as “AI predicts an outage.” Use “Estimated additional run-rate: INR 8,400/month” and separately “Estimated effect this billing period: INR 4,200.” Avoid presenting model-generated wording as a verified incident diagnosis.

## 3. Navigation and application shell

### Public routes

| Route | Purpose |
| --- | --- |
| `/` | Product introduction and clear entry to the console or isolated demo. |
| `/login` | Sign-in entry using the configured identity provider. |
| `/onboarding` | New workspace setup and invitation completion. |

Workspace routes use the prefix `/w/[workspaceSlug]`. Resolve the slug to an authorized workspace identity; URLs do not grant access.

### Sidebar information architecture

| Group | Item | Workspace route suffix | Purpose |
| --- | --- | --- | --- |
| Operate | Overview | `/overview` | Health, demand, financial position, and prioritized next actions. |
| Operate | Resources | `/resources` | Services and their underlying infrastructure. |
| Operate | Monitoring | `/monitoring` | Metrics, service health, alerts, and forecasts. |
| Optimize | Recommendations | `/recommendations` | Evidence-backed allocation/scaling/cost opportunities. |
| Optimize | Costs & Billing | `/costs` | Spend, forecasts, billing periods, budgets, and savings. |
| Control | Changes | `/changes` | Approvals, queued/running work, and verified outcomes. |
| Control | Policies | `/policies` | Scoped permissions, limits, budgets, and operating rules. |
| Intelligence | AI Copilot | `/copilot` | Full-screen conversations, evidence, and what-if comparisons. |
| Workspace | Audit Log | `/audit` | Searchable decision and execution history. |
| Workspace | Settings | `/settings` | Connections, users, AI settings, documents, and preferences. |

Additional deep links: `/services/[serviceId]`, `/resources/[resourceId]`, `/changes/[changeId]`, and `/copilot/[threadId]` under the workspace prefix.

### Shell

- Desktop sidebar: 248–256 px, collapsible to an icon rail with accessible names.
- Sidebar top: logo and workspace switcher. Footer: current user, role, help, logout.
- Sticky 64 px header: breadcrumb/page title, source/freshness context, **Ask Copilot**, notifications, and user menu.
- One scope toolbar beneath the header: provider, account, environment, service, region, and relevant time range. Collapse infrequently used filters into **More filters**.
- Main area: 12-column grid, 20–24 px gaps, maximum width around 1680 px for summaries; detailed tables can use the available width.
- Command palette on `Ctrl/Cmd+K`: search authorized services/resources and navigate to pages. Executable actions still enter review.

### Scope and navigation behavior

- Store shareable filters, selected tab, sorting, and time range in the URL.
- Scope-changing links carry the relevant context; an audit or billing page explicitly states unsupported filters.
- Clear incompatible account/region selections when provider changes and announce the new scope.
- Historical monitoring uses the selected range; current inventory is labeled Current, and billing uses its selected billing period.
- Workspace switching clears protected caches and starts a new workspace-scoped Copilot context. A thread never silently changes workspace.
- Clicking a citation opens the scoped source window or record, with a route back to the question.

## 4. Responsive layouts

| Viewport | Layout behavior |
| --- | --- |
| 1536 px and above | Full sidebar, six KPI columns when readable, paired analysis panels, optional side-by-side Copilot. |
| 1280–1535 px | Full/collapsible sidebar, KPI grid usually 3 × 2, secondary panels stack as needed. |
| 768–1279 px | Navigation rail/drawer, two-column summaries, compact filter menu, overlay Copilot. |
| 360–767 px | Mobile navigation drawer, single-column content or two compact KPIs, full-screen review/Copilot sheets, sticky action footer. |

Tables may scroll inside labeled containers with the primary name column visible; the overall page must not overflow horizontally. Resource-card mode is useful on small screens. Charts reduce tick density without hiding units. Dialog footers must not obscure errors or the last input at 200% zoom.

## 5. Public entry and first-use experience

### 5.1 Product homepage

Use a clean product page with a short headline such as **“Understand your cloud. Make better changes.”** Show a realistic console preview, three outcomes—unified visibility, AI-assisted investigation, cost-aware scaling—and the workflow from insight to approved action.

Primary CTA: **Open console**. Secondary CTA: **Explore demo**. Explain that demo data is simulated. Avoid fabricated customer logos, savings claims, uptime claims, or a preview pretending to be a live customer account.

### 5.2 Sign-in and invitations

A branded sign-in card presents **Continue with SSO** and configured email/social sign-in methods, redirecting through the identity provider. Maintain consistent CloudOps branding on the hosted identity screen where supported.

Invitation acceptance displays workspace name and invited role. An expired invitation offers a clear next step. Preserve intended authorized navigation after sign-in. Session expiry explains why the user must sign in again.

### 5.3 Onboarding

Use a four-step guided workspace setup:

1. **Workspace:** Name, timezone, and initial membership context.
2. **Data source:** Connect a supported account or launch an isolated demo workspace.
3. **Discovery:** Show connection progress, discovered services/resources, partial capabilities, and optional mapping corrections.
4. **Operating preferences:** Set an initial budget and policy defaults, then open the first health overview and AI brief.

Allow incomplete configuration to be resumed. Users can inspect discovered resources while cost history is still ingesting. Report “Metrics connected; billing still syncing” rather than one misleading all-or-nothing state.

## 6. Core screen specifications

### 6.1 Overview — Command Center

**Purpose:** Present service health, demand, financial position, and the most useful next action.

**Wide-screen structure:**

```text
CloudOps sidebar | Overview                       [Ask Copilot] [Alerts] [User]
                 | Provider / Account / Environment / Service / Region / Range
                 |------------------------------------------------------------
                 | Health banner: 2 services need attention       [Investigate]
                 |------------------------------------------------------------
                 | Services | Requests | Latency | Uptime | MTD spend | Savings
                 |------------------------------------------------------------
                 | AI operational brief                         [Sources] [Ask]
                 |------------------------------------------------------------
                 | Traffic + latency (8 columns) | Utilization (4 columns)
                 |------------------------------------------------------------
                 | Priority recommendations: evidence → allocation → cost
                 |------------------------------------------------------------
                 | Service health table                          [View all]
                 |------------------------------------------------------------
                 | Spend + budget                  | Provider distribution
                 |------------------------------------------------------------
                 | Active alerts                   | Recent changes
```

**Behavior and content:**

- Health banner gives highest severity, affected service counts, and **Investigate** with scoped filters.
- KPI cards show healthy/total services, request count for the selected window, average latency, uptime with period/coverage, month-to-date spend, and deduplicated estimated savings. Active resource count is available in the service/resource summary.
- AI brief contains at most three important findings, each linked to evidence. Show Generated at, data freshness, and **Refresh brief** when its source window changes.
- Traffic and latency charts label each axis; provide separate-series views when a combined chart would confuse the scale.
- Priority recommendations show evidence, proposed action, financial delta, and readiness; **Review change** opens the shared workflow.
- Health table defaults to critical/warning services, then healthy ones; Unknown is never omitted.
- Cost widgets display billing source and period. Forecast series differ visually from incurred spend.
- Failed panels retry independently. Background refresh retains the last valid snapshot with freshness metadata.

### 6.2 Resources — Services and infrastructure

**Layout:** Tabs for **Services** and **Infrastructure**, with a search/filter toolbar, saved-view menu, and a full-width table or mobile cards.

**Service columns:** Name, environment, owner, health, request rate, p95 latency where available, error rate where available, mapped resource count, estimated cost, and attention count.

**Infrastructure columns:** Name/type, provider/account, canonical region with display label, service mapping, lifecycle, health, allocation, utilization, monthly run-rate, last sync, and supported actions.

**Interactions:** Real links open service/resource details. Quick view exposes a concise summary and **Open full details**. Actions include **Ask Copilot**, **Compare capacity**, and supported **Restart**. Admins can edit service mappings and ownership. Creation through infrastructure templates is marked as R3 and appears only when supported.

Use column visibility controls for technical metadata. Preserve filters and scroll position on return. An empty account offers **Connect account** or **Refresh discovery** as appropriate; an empty filter result offers **Clear filters**.

### 6.3 Service and resource detail

**Header:** Breadcrumb, name, environment, health/lifecycle, owner, provider scope, and last observation. Primary actions: **Ask Copilot** and **Review capacity** when supported.

**Service tabs:** Overview, Metrics, Infrastructure, Costs, Recommendations, Changes. The Infrastructure tab shows declared relationships; a later topology view can visualize dependencies without implying unverified causal links.

**Resource tabs:** Overview, Metrics, Configuration, Costs, Changes. Show current/desired configuration, capabilities, controller ownership, relevant policy limits, and provider identifiers.

**Overview layout:** Main analysis takes eight columns; configuration, budget, and next action take four. A context card explains which resource is actually scalable and which supplies application traffic.

**Actions:** A manual capacity proposal or restart enters the shared change-review flow. Display an active operation beside the affected configuration and link to its timeline. Unsupported actions explain the missing provider capability or external controller ownership.

### 6.4 Monitoring — Metrics, alerts, and forecasts

**Tabs:** Metrics, Health & Alerts, Forecasts. Forecasts is enabled for R2 capability; insufficient history is a normal state.

- Metrics: shared time range and comparison controls; charts for traffic, latency, errors, CPU/memory, storage, network, and probe uptime.
- Health & Alerts: service health strip, severity filters, deduplicated alert list, affected scope, acknowledgment/mute controls for permitted roles, and incident/change annotations.
- Forecasts: historical observations, a clear “Forecast begins” boundary, predicted median, shaded prediction interval, and baseline/model label. Show accuracy, training coverage, and last evaluation.

**Interactions:** Brush or select a chart window, then choose **Explain this change** to open scoped Copilot. Tooltips and keyboard-accessible data tables expose exact values. Pausing live view freezes presentation only; resuming fetches a fresh snapshot.

Missing samples remain gaps. A partially instrumented service displays the signals actually available. “Insufficient history: 18 of 28 required days” explains forecasting readiness without drawing a fabricated prediction.

### 6.5 Recommendations — Prioritized opportunities

**Layout:** Summary cards for urgent actions, actionable savings, and recommendations needing evidence; category filters for Scaling, Allocation, and Cost optimization; list/card toggle.

**Each recommendation includes:**

- Target service/resource and environment.
- Plain-language reason, source method, and evidence quality.
- Current → proposed configuration and estimated period/run-rate difference.
- Operational urgency, expected benefit, capability status, and policy readiness.
- Generated/expiry timestamps, evidence links, and any overlap with another opportunity.

**Actions:** **Review change**, **Explain with AI**, **View evidence**, **Snooze**, and **Dismiss**, subject to role. Advisory items use **View guidance** and clearly identify the required provider operation. Expanded details show ranking factors and tradeoffs rather than a mysterious AI score.

Dismissal/snooze captures an optional reason and persists. A materially changed condition can create a new recommendation linked to the previous one. Savings summaries deduplicate mutually exclusive opportunities.

### 6.6 Shared change review — Preview, authorize, verify

Use one component for manual changes, recommendation actions, Copilot drafts, and supported restart/revert proposals.

**Container:** 680–760 px desktop drawer, expandable for side-by-side comparison; full-screen mobile dialog. The footer stays visible while details scroll. Close other modal surfaces when opening review from Copilot.

**Stages:** **Proposal → Impact & checks → Submit / approval → Execution & outcome**.

```text
Review capacity change · Production API / api-asg                    [Close]
AWS · Production · Mumbai · Demo data

Evidence: traffic +34%; CPU 82% / 10 minutes              [View measurements]
Current replicas: 4             Proposed replicas: [-] 6 [+]
Allowed: 2–8                    Maximum step: 2

                       CURRENT          PROPOSED            DIFFERENCE
Monthly run-rate       INR 16,800       INR 25,200           +INR 8,400
Remaining-period effect                                    +INR 4,200
Projected period spend INR 180,000      INR 184,200
Budget                 INR 200,000     Headroom INR 15,800

[Capacity passes] [Budget passes] [Cooldown passes] [Separate approval needed]
Price basis: 730-hour month; 365 hours remaining         [Calculation details]
Preview valid until 14:35 UTC                           [Refresh preview]

Change note: [                                                               ]
[Cancel]                                                   [Request approval]
```

The illustrative numbers match the scenario in [PRD.md](PRD.md).

**Required behavior:**

1. Identify the exact executable target, current version, mode, and controller ownership.
2. Validate editable capacity and explain limits. A changed input invalidates the previous executable preview.
3. Present price source, currency, incurred/forecast distinction, coverage, operational assumptions, and uncertainty.
4. Show every relevant capacity, budget, window, cooldown, permission, and approval check with the controlling scope.
5. Use **Apply change** when permitted without approval, **Request approval** when required, and **Approve and apply** for a valid Admin review.
6. A separate-approver policy shows “Awaiting another Admin” to the requester rather than offering self-approval.
7. Expired or materially changed previews require **Refresh preview** and renewed confirmation. Viewer what-if mode remains non-executing.
8. Submission produces a request ID and then an approval or operation state. Duplicate submission is disabled while pending.
9. A running operation can be followed after closing the drawer. Closing it does not cancel the operation.
10. Show **Reconciling provider state** for ambiguous outcomes. Display observed configuration and failure details rather than a generic retry button.
11. Show **Configuration verified** on success, followed by observed before/after performance when available. **Review revert** creates a new proposal.

### 6.7 Changes — Approval inbox and execution history

**Tabs:** Needs approval, In progress, History. Display counts derived from current records.

**List columns:** Requested action, service/environment, requester, source (Manual / Recommendation / Copilot draft), cost effect, approval policy, age/expiry, and request/operation status.

**Approval detail:** Versioned proposal, fresh checks, supporting evidence, change note, requester/approver constraints, and explicit **Approve and apply** / **Reject**. Reject requires a brief reason. Cancel is available only before worker claim and according to role/ownership.

**Execution detail:** Timeline from proposal through approval, queueing, provider call, reconciliation, confirmed configuration, and post-change observation. Link provider reference, recommendation, private Copilot thread when authorized, and audit record. A shared change record shows the submitted draft snapshot without exposing the creator's private conversation.

**Failure experience:** Explain which stage failed, whether any provider state changed, and what can be done next. Request history and operation outcomes are separate: an approved request can still have a failed operation.

### 6.8 Costs & Billing — Financial workspace

**Tabs:** Overview, Breakdown, Billing, Budgets, Savings. The primary period selector is the billing month; comparisons use equivalent coverage.

- **Overview:** Incurred month-to-date spend, run-rate, projected month-end spend with interval when available, budget headroom, and estimated optimization savings.
- **Breakdown:** Provider/account/service/environment/resource grouping, daily trends, price/usage contribution where supported, and an Unattributed row. Click a row to drill down or ask **Explain this increase**.
- **Billing:** Period/account/currency summary, known adjustments, completeness, source freshness, and provider document references where supplied. Label Estimated usage, Provider-reported usage, or Finalized document.
- **Budgets:** Scope, period, currency, warnings, forecast, outstanding commitments, and headroom. Admin create/edit form; other roles inspect.
- **Savings:** Proposed opportunities versus measured post-change results. Explain comparison windows, demand changes, and overlapping recommendations.

Charts distinguish incurred spend from future forecasts using solid/dashed lines and labels. Actual values and units remain accessible in tables. Different currencies remain separate unless the user explicitly selects a documented conversion basis. **Export CSV** respects current scope and period.

### 6.9 Policies — Understandable operating boundaries

**Layout:** Scoped policy list, enabled state, concise rule summary, attached budgets, approval requirement, and last modification.

**Editor sections:** Identity; workspace/account/environment/service/resource scope; allowed actions; min/max capacity; maximum step; cooldown and operating window; approval and separate approver; linked budgets; enabled state.

**Rule preview:** Show matching resources, the resulting effective limits, and conflicts with other active policies. Present a readable sentence such as “Production API may run 2–8 replicas; changes of at most 2 require a different Admin during the configured window.”

Policy creation/update/toggle returns server-confirmed state and an audit event. **Explain policy** opens a cited Copilot explanation of the same rule. It does not rewrite or save the rule on its own.

### 6.10 AI Copilot — Full workspace and contextual panel

**Full-page layout:** A conversation list on the left, main conversation in the center, and collapsible evidence/details panel on the right. On mobile, these become separate sheets. A contextual version opens as a 440–520 px side panel; below 1280 px it overlays instead of compressing charts excessively.

**Entry points:** Header **Ask Copilot**, chart **Explain this change**, resource **Ask about this service**, recommendation **Explain**, cost **Explain this increase**, and change **Summarize outcome**.

**Empty state:** A concise introduction and scoped prompts:

- “What needs attention in production?”
- “Why did spending increase this week?”
- “Compare four versus six replicas for Production API.”
- “Explain the latest failed change.”

**Composer:** Visible workspace/service/period context chips, text input, Send, and Stop generation. Scope changes are explicit; a thread keeps its workspace. Display available evidence sources and any data/model outage near the input.

**Answer anatomy:**

1. Short conclusion.
2. Two to five supporting findings with clickable source references.
3. Relevant mini-chart, cost comparison, or structured table when useful.
4. Measured facts versus hypotheses/uncertainty.
5. Next actions: **Open monitoring**, **View cost breakdown**, **Compare options**, or **Review draft**.
6. Generated timestamp, source freshness, model label in details, and helpful/not-helpful feedback.

**Example interaction:**

```text
YOU: Why should we increase Production API capacity?

COPILOT:
Traffic rose 34%, while CPU averaged 82% during the last 10 minutes. [1] [2]
The capacity rule proposes 6 replicas to move toward a 60% CPU target. [3]

Current: 4 replicas / INR 16,800 per month
Proposed: 6 replicas / INR 25,200 per month
Remaining-period effect: +INR 4,200. [4]

Latency improvement is not guaranteed; verify it after the change.
This production policy requires a separate Admin approval. [5]

[View evidence] [Compare options] [Review draft]
```

Each numbered reference opens an actual authorized measurement, pricing snapshot, or policy record. Citation IDs are resolved by the application, not rendered as arbitrary model-provided links.

**Progress states:** Reading metrics → Checking cost data → Preparing answer. These labels describe completed/in-flight tool activity, not hidden model reasoning. Users can stop a run; already committed infrastructure work is unaffected because chat does not execute it.

**Failure and ambiguity:** Offer Retry for a transient model failure; ask a focused clarification when scope is missing; show Insufficient evidence rather than inventing figures. If a source is revoked/deleted, mark it unavailable and refresh the answer as needed. Mark recorded responses Replay; do not disguise them as fresh model output.

### 6.11 Audit Log

**Table:** Timestamp, actor, action, target, source, result, request/operation ID. Filters cover period, actor, action, target, environment, and outcome.

**Details:** Human-readable timeline and configuration diff, actor/approver, policy/pricing versions, source draft/recommendation, observed outcome, and expandable structured payload. Preserve target-name snapshots after deletion. Export respects workspace permissions.

Do not expose private Copilot message text in shared audit views; show the submitted action artifact and permitted evidence references.

### 6.12 Settings

| Tab | Contents and interactions |
| --- | --- |
| Connections | Provider identity, regions, capabilities, source health, sync lag, errors; Admin connect/validate/configure workflow. |
| Users & roles | Invitations, membership state, role changes, and separate-approver availability. |
| Services & ownership | Tag mapping rules, explicit service membership, owners, environments, and capacity-controller ownership. |
| AI & usage | Enablement, model identity, data-source controls, daily usage limit, token/spend charts, and service status. |
| Knowledge [R2] | Runbook upload, indexing status, document version/source, access, expiry, and deletion. |
| Preferences | Timezone, formatting, notification delivery, and accessibility/display preferences. |
| Demo scenarios | Demo-only Admin controls for normal demand, surge, idle workload, budget block, stale data, model failure, and ambiguous provider outcome. |

Connection wizard: provider → account identity/role reference → validate → review read/action capabilities → discovery. Never present a connector as ready merely because a form was submitted.

### 6.13 Notifications

Header popover/full-width mobile sheet with unread count, severity, message, timestamp, and direct link. Persist read state and **Mark all read** per user. An acknowledgment is not resolution of an alert. An operation notification uses its durable result rather than assuming submission succeeded.

## 7. Shared components and behavior contracts

| Component | Responsibility |
| --- | --- |
| `WorkspaceShell`, `ScopeToolbar`, `CommandPalette` | Navigation, authorized context, URL-backed scope, and accessible search. |
| `MetricCard`, `FreshnessBadge`, `HealthBadge` | Values with units/period, source age, and independent health state. |
| `DataTable`, `ResourceQuickView` | Sorting, pagination, real navigation links, scoped actions, and mobile containment. |
| `ChartPanel`, `ForecastChart`, `EvidenceDrawer` | Coverage, units, history/prediction distinction, source drill-down, and table alternatives. |
| `RecommendationCard`, `SavingsSummary` | Evidence, ranking factors, applicability, and non-overlapping estimated benefit. |
| `ChangeReview`, `CostImpact`, `PolicyChecks` | One authoritative presentation for all proposed changes. |
| `ApprovalPanel`, `OperationTimeline`, `ConfigurationDiff` | Explicit decisions, durable progress, and observed before/after state. |
| `CopilotPanel`, `AnswerBlock`, `CitationLink`, `DraftCard` | Scoped AI interaction, structured output, source resolution, and review handoff. |
| `ConnectionWizard`, `BudgetEditor`, `PolicyEditor` | Guided configuration with server-confirmed results. |

### Interaction rules

- Use real links for navigation and buttons for actions. A clickable row never removes keyboard-accessible controls.
- Avoid optimistic capacity, billing, policy, or execution-success updates. Lightweight read-state changes may be optimistic with rollback on failure.
- Keep unsaved input after validation errors. Warn about unsaved form changes only when navigation would discard user work.
- Stream updates must not reorder a table while the user is interacting with a row; offer a clear refresh/new-results indicator.
- Use one active modal surface with focus restoration. Opening review from Copilot preserves the thread for return.
- Exports and saved views retain the disclosed scope and period. Currency/date formatting is consistent across screens.

## 8. State system

| Domain | Visible states |
| --- | --- |
| Data mode | Demo, Live provider, Replay; Mixed only with per-source labels. |
| Data freshness | Fresh, Updating, Stale, Partial, Unavailable. |
| Service health | Healthy, Warning, Critical, Unknown. |
| Recommendation | Active, Snoozed, Dismissed, Expired, Superseded, Applied. |
| Request | Awaiting approval, Authorized, Approved, Rejected, Expired, Cancelled before execution. |
| Operation | Queued, Running, Reconciling, Succeeded, Failed, Cancelled before execution. |
| Copilot run | Idle, Reading evidence, Generating, Completed, Stopped, Failed, Usage limit reached. |
| Document [R2] | Uploaded, Indexing, Ready, Failed, Expired, Deleted. |

Loading skeletons preserve layout without fake values. Empty states distinguish no account, no data, no matching filters, and no recommended action. A missing numeric measurement is an em dash plus explanation, not zero. Failed panels offer local retry; a lost stream keeps the last valid timestamp and refetches on reconnect.

## 9. Accessibility and usability requirements

- WCAG 2.2 AA target, including contrast, keyboard use, logical headings, visible focus, and status announcements.
- Label icon-only controls, sorting, charts, source citations, and context chips.
- Focus-trap dialogs correctly and return focus to the launcher. Offer Escape/close behavior appropriate to the state.
- Announce significant operation/AI status changes without reading every telemetry update or token aloud.
- Provide chart summaries and accessible tables; do not rely on color for severity, series identity, or forecast uncertainty.
- Support 200% zoom, reduced motion, and content at 360 px without lost actions.
- Show units, scope, period, and source wherever a number could otherwise be misunderstood.
- Test with a developer, product owner, finance user, and platform Admin; include at least one keyboard-only session.

## 10. Frontend delivery and acceptance

1. Deliver tokens, shell, routing, identity/onboarding, and reusable data-state components.
2. Build overview, service/resource inventory, details, and monitoring on typed API contracts.
3. Build recommendations, cost/billing/budget screens, policy editing, shared review, and Changes timeline.
4. Integrate contextual/full Copilot, real citations, streaming states, what-if results, and structured draft handoff.
5. Complete notification/audit/settings surfaces, responsive behavior, and negative-state scenarios.
6. Add R2 forecasts, runbook evidence, and live connector details after their data contracts pass verification.

R1 acceptance requires all PRD Journeys A–D, keyboard-complete review and Copilot flows, consistency between summary/detail figures, persisted workflow state after refresh, and usable layouts at the four target widths. R2 adds forecast uncertainty, source-document lifecycle, and real-provider reconciliation views.

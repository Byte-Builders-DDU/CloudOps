# CloudOps — Product Requirements Document

| Field | Value |
| --- | --- |
| Problem statement | PS-10: Unified Cloud Resource, Scaling & Cost Management Platform |
| Version | 2.0 — Greenfield product specification |
| Date | 2026-09-19 |
| Status | Proposed implementation baseline |
| Companion documents | [Frontend design](DESIGN.md), [Technology and architecture](TECH_STACK.md) |

## 1. Product vision

**CloudOps is an AI-assisted cloud operations workspace that turns infrastructure data into understandable, cost-aware, authorized action.**

A user should be able to discover a performance issue, ask why it is happening, compare possible changes, understand their financial impact, and apply an approved change without navigating several cloud consoles.

The central experience is:

**Observe → investigate with AI → evaluate a recommendation → preview impact → authorize → execute → verify.**

This is a from-scratch specification. All capabilities, systems, and screens described here are work to be built. The product and technology choices are defined by PS-10 and the desired experience, with no dependency on an earlier implementation.

### Product promise

- One coherent view of services, infrastructure, performance, spending, and changes.
- Recommendations backed by measurements, pricing, and explicit operating limits.
- An AI Copilot that answers operational questions using attributable workspace data.
- Guided execution with observable progress and a complete decision history.
- A common experience across supported cloud providers, with honest capability differences.

## 2. Users, workspaces, and access

### Personas

| Persona | Need | Typical role |
| --- | --- | --- |
| Developer | Understand service pressure and adjust capacity quickly. | Operator |
| Product owner | Understand availability, demand, and the impact of planned growth. | Viewer |
| Finance / operations analyst | Explain spend, compare forecasts, and evaluate savings. | Viewer, or Admin for budget management |
| Platform / DevOps owner | Connect accounts, define limits, approve sensitive changes, and investigate incidents. | Admin |

### Workspace model

A workspace owns its cloud accounts, services, resources, budgets, policies, operational records, documents, and AI conversations. A user can belong to multiple workspaces through explicit memberships. Authorization and isolation apply from the first release, including background jobs, exports, search, and AI retrieval.

A **service** is a logical application or workload, such as Production API. A **resource** is a provider object, such as an Auto Scaling Group, load balancer, database, or storage bucket. Service membership comes from explicit mappings and configured tags. The interface distinguishes application demand from the infrastructure supporting it.

### Permission matrix

| Capability within an authorized workspace | Viewer | Operator | Admin |
| --- | --- | --- | --- |
| Inspect metrics, resources, costs, recommendations, policies, and audit events | Yes | Yes | Yes |
| Ask Copilot questions and inspect supporting evidence | Yes | Yes | Yes |
| Generate a non-executing what-if comparison | Yes | Yes | Yes |
| Submit permitted scaling/restart requests | No | Yes | Yes |
| Dismiss/snooze recommendations | No | Yes | Yes |
| Approve or reject approval-required changes | No | No | Yes |
| Manage accounts, service mappings, policies, budgets, and runbooks | No | No | Yes |
| Invite users and assign workspace roles | No | No | Yes |
| Configure AI settings and workspace AI usage limits | No | No | Yes |

Rules:

- Invitations and role changes are server-authorized; users do not choose their own access level.
- Workspace creation grants the creator Admin only for that newly created workspace. Invited users receive the invited role.
- All roles remain subject to hard policy limits. Approval does not override a failed budget or capacity check.
- An approval-required request needs an explicit Admin decision. A configurable separate-approver rule prevents self-approval; enable it by default for production environments.
- A requester can cancel their own request before execution; Admins can cancel other unstarted requests. Running work is reconciled rather than presumed cancelled.
- Demo users, data, and connectors belong to isolated demo workspaces and cannot target live accounts.

## 3. Goals and measurable outcomes

Targets below are release criteria to validate, not achieved performance claims.

| Goal | Success measure |
| --- | --- |
| Reduce routine investigation overhead | At least 4 of 5 representative users locate an unhealthy service and its supporting evidence in under 60 seconds. |
| Make changes understandable | At least 4 of 5 users correctly identify proposed capacity, cost increase, and approval requirement from the review screen. |
| Shorten routine operations | An Operator submits an eligible change within 2 minutes, excluding approval wait and provider execution. |
| Provide useful AI answers | On a maintained 100-question evaluation set, at least 90% of answers are correct and at least 95% of factual operational claims have valid supporting citations. |
| Preserve financial correctness | Every executable cost-changing proposal has a reproducible estimate, declared currency, scope, timestamp, and budget decision. |
| Enforce permission and operating limits | All isolation, authorization, approval, budget, stale-plan, and concurrent-change acceptance scenarios pass. |
| Verify outcomes | Every executed request has a recorded observed result; configuration success and performance improvement are reported separately. |
| Demonstrate optimization value | Show estimated savings and measured post-change cost/utilization with a disclosed comparison window and attribution limits. |

## 4. Release strategy

Build complete vertical workflows in three releases. R1 is a compelling functional MVP; R2 is a live-provider beta; R3 delivers advanced multi-cloud operation.

| Release | Required scope | Exit evidence |
| --- | --- | --- |
| **R1 — AI-assisted MVP** | Workspace identity, service inventory, persistent simulated telemetry, monitoring, explainable recommendations, real LLM-powered Copilot, cost/billing views, budgets, policies, approvals, durable operations, and audit trail. | End-to-end surge and optimization scenarios, a real model-backed cited answer, permission/budget rejection, failure reconciliation, and accessibility/isolation checks. |
| **R2 — Live AWS beta and predictive insights** | Live AWS inventory/metrics/costs, ASG scaling, operational deployment, statistically evaluated forecasts, contextual anomaly investigation, document-grounded runbooks, and outcome tracking. | Controlled live-account change with confirmed provider result; billing reconciliation; forecast backtests; worker restart/recovery and rollback-review exercises. |
| **R3 — Multi-cloud and bounded automation** | Azure/GCP adapters, expanded executable actions, policy-authorized scheduled/predictive scaling, richer allocation optimization, and cross-cloud comparisons. | The same contracts and user journeys pass across supported providers; automatic actions remain bounded, auditable, and suspendable. |

### Scope boundaries

- R1 must call an actual LLM for its AI acceptance demonstration. Recorded AI fixtures support offline tests but are visibly marked Replay and do not satisfy that gate.
- R1 can use simulated AWS, Azure, and GCP accounts. Live multi-cloud support requires R3 connector acceptance.
- R1 executable changes focus on supported capacity adjustments and restart operations. Instance-family changes, storage changes, and commitment purchases can appear as advisory opportunities until their execution capability is delivered.
- CloudOps manages infrastructure decisions and billing visibility. Payment collection, arbitrary shell execution, a replacement for every provider-console feature, and an unrestricted autonomous agent are outside the initial scope.
- Infrastructure definition/provisioning through curated templates is an R3 extension; operational changes must account for any external autoscaler or infrastructure-as-code owner.

## 5. Functional requirements

### FR-01 — Identity, workspace access, and onboarding [R1]

- Provide OIDC-based sign-in, invitation acceptance, logout, session expiry, and workspace switching.
- Guide a new workspace through account/demo selection, service discovery, budget setup, and first insight.
- Show the current workspace, identity, role, and Demo/Live context throughout the console.
- Apply workspace authorization to every data access, mutation, event subscription, and AI tool call.
- Preserve the intended destination after sign-in and communicate restricted routes clearly.

**Acceptance:** A user in workspace A cannot retrieve workspace B data by guessing a resource ID, altering a filter, exporting records, subscribing to events, or asking Copilot.

### FR-02 — Accounts, services, and resource inventory [R1; live adapters R2/R3]

- Discover resources with provider/account, canonical region, service type, lifecycle, allocation, supported actions, ownership, and last successful sync.
- Group resources into services through configured tags and Admin-managed mappings; disclose shared/unattributed resources.
- Support search, filtering, sorting, saved views, pagination, service details, and resource details.
- Validate a cloud connection before presenting it as operational; display partial permissions and unsupported capabilities.
- Link a service's traffic source, infrastructure metrics, dependencies, costs, and change history without double counting.

**Acceptance:** Production API exposes its mapped load balancer and scaling group; scaling targets the group, while application traffic comes from the configured service boundary.

### FR-03 — Unified overview [R1]

- Summarize service health, active infrastructure, request demand, latency, uptime, month-to-date spend, budget forecast, and optimization opportunities.
- Show a prioritized attention list, resource/service health table, recent changes, and a cited AI operational brief.
- Filter by workspace, provider, account, environment, service, and region where applicable.
- Carry applicable filters into drill-downs. Each widget labels its own period and data coverage.
- Derive summaries from canonical records; distinguish zero, missing, stale, partial, and unsupported data.

**Acceptance:** A scoped overview agrees with its detail pages, and a failed widget retains independent working panels without substituting demo numbers.

### FR-04 — Monitoring, uptime, and service health [R1]

- Monitor request rate/count, average and p95 latency, error rate where instrumented, CPU, memory, storage usage/allocation, network throughput, uptime, and health.
- Provide 1h, 6h, 24h, 7d, and 30d windows with optional custom dates, comparison periods, thresholds, and event annotations.
- Support service-level and resource-level analysis, with a data-table alternative to charts.
- Persist live/simulated observations, sampling intervals, source timestamps, ingestion timestamps, and coverage.
- Show freshness independently from stream connectivity. Include Unknown health when evidence is insufficient.

**Acceptance:** A scenario changes both live and historical views. Missing probes reduce coverage and never count as successful uptime observations.

### FR-05 — Recommendation engine [R1; predictive candidates R2]

- Generate scale-up, scale-down, rightsizing, idle-resource, and cost-optimization opportunities from recorded evidence.
- Provide current/proposed allocation, reason, evidence window, estimate, applicability, urgency, and policy evaluation.
- Mark the basis as Rule-based, Statistical, Forecast-assisted, or AI explanation. Explainability is required regardless of generation method.
- Rank recommendations by operational urgency, expected benefit, evidence quality, and action feasibility; expose those factors.
- Deduplicate overlapping opportunities so the same capacity reduction is not counted twice as savings.
- Persist dismissals/snoozes and expire or supersede outdated evidence. Keep historical decisions inspectable.

**Acceptance:** Identical telemetry and configuration produce the same authoritative capacity/pricing decision; refreshing does not resurrect a dismissed static recommendation.

### FR-06 — AI Operations Copilot [R1]

- Answer questions such as “Why is latency increasing?”, “What changed in our costs?”, and “Which services should we optimize?” using authorized workspace facts.
- Support contextual entry from charts, resources, recommendations, cost rows, and changes, plus a full conversation workspace.
- Return concise answers with evidence citations, time windows, source freshness, supporting charts/tables, and useful next actions.
- Compare scenarios such as four versus six instances by invoking the same deterministic preview/calculation services used by the UI.
- Produce a structured change draft that the user can open in the standard review flow. Chat text alone never authorizes execution.
- Ask for missing scope, acknowledge insufficient evidence, distinguish correlation from a supported cause, and handle unavailable tools/models explicitly.
- Store conversations privately per creator within their workspace. Reauthorize source access on every subsequent read/run; workspace sharing is a later explicit feature.
- Capture helpful/not-helpful feedback and usage/cost metadata for evaluation.

**Acceptance:** “Why did our cost increase?” yields correct scoped figures and valid citations. “Scale Production API” produces a non-executing draft; the same server-side authorization and approval path is required to act on it.

### FR-07 — AI briefs and investigation [R1; runbook retrieval R2]

- Generate short operational briefs from structured health, demand, spend, recommendation, and change facts.
- Explain significant alerts with relevant evidence and possible contributing events, ordered by support.
- In R2, retrieve authorized workspace runbooks and approved operational documents with document-version citations.
- Show what is measured, what is inferred, and what remains unknown. An AI narrative must not manufacture root-cause certainty.
- Keep structured dashboards and recommendations usable when AI is unavailable or its usage budget is exhausted.

**Acceptance:** A latency explanation references the actual metric window and related changes. A suggested runbook step includes an accessible document reference; unsupported claims are omitted or explicitly identified as hypotheses.

### FR-08 — Anomalies and forecasting [statistical alerts R1; forecast models R2]

- Detect sustained telemetry and cost deviations using robust statistical baselines and configured minimum data coverage.
- Add demand forecasts for the next 24 hours and seven days, and a billing-period cost forecast with uncertainty and last evaluation time.
- Start with seasonal-naive baselines; promote a trained model only after chronological backtesting demonstrates an improvement.
- Display the model/baseline label, prediction interval, training-data sufficiency, and historical error.
- Use forecasts to suggest capacity review; apply the same pricing, capability, policy, and authorization checks as reactive recommendations.

**Acceptance:** Sparse data falls back to a clearly labeled baseline or Insufficient history. Forecast evaluation uses future holdouts and never presents a model's unvalidated estimate as guaranteed demand.

### FR-09 — What-if planning, scaling, and resource actions [R1]

- Provide one shared preview flow for manual actions, recommendation actions, and Copilot drafts.
- Show before/after allocation, expected operational effect, price assumptions, run-rate difference, remaining-period impact, and budget position.
- Bind executable previews to resource/configuration versions, policy versions, actor, and expiry.
- Require explicit submission; route approval-required proposals into a Changes approval queue.
- Track queued, executing, reconciling, verified-success, failed, and pre-execution-cancelled outcomes.
- Reconcile ambiguous provider responses before retrying. Retain actual observed state after a partial outcome.
- Allow a follow-up revert proposal when supported; a revert is a newly evaluated change rather than an assumed automatic rollback.

**Acceptance:** Duplicate clicks produce one logical operation. A provider timeout does not produce a false success or an unverified repeat mutation.

### FR-10 — Policy, permission, and operational controls [R1]

- Configure scope by workspace, account, environment, service, or resource.
- Support min/max capacity, maximum step, cooldown, allowed actions, approval requirements, separate approver, operating windows, and linked budgets.
- Evaluate all matching enabled policies: intersect capacity/action ranges, use the smallest step limit and longest cooldown, and require any matching approval constraint.
- Show failed checks and contradictory configuration with the exact relevant scope and rule.
- Revalidate on submission, approval, and execution. Changed material terms require renewed review.
- Account for external desired-capacity controllers; designate CloudOps ownership, a supported coordinated mode, or read-only advice for each scalable target.

**Acceptance:** A direct API call cannot bypass the limits shown by the UI, and an externally managed group cannot silently enter competing scaling control.

### FR-11 — Costs, budgets, and financial impact [R1]

- Show incurred spend, monthly run-rate, month-end forecast, configured budget, remaining headroom, and deduplicated optimization savings.
- Break costs down by provider, account, environment/service where attributable, resource where available, and period; retain unattributed charges.
- Keep observed billing, catalog-based estimates, amortized commitments where supported, and predictions distinct.
- Support scoped budgets by billing period/currency and configurable warning thresholds.
- Include outstanding positive commitments when authorizing concurrent changes. Pending savings do not create spendable headroom.
- Block proposals crossing a hard budget. For an already-exceeded budget, permit a strictly cost-reducing proposal only if all other controls pass; show the remaining overage.
- Provide scoped CSV exports and an evidence-backed cost-change explanation.

**Acceptance:** The preview, approval, operation history, and cost view use the same price snapshot and units. Different currencies are separated unless a declared dated conversion is explicitly selected.

### FR-12 — Billing visibility [R1; provider documents where supported R2/R3]

- Present billing-period summaries with account/provider, usage subtotal, available taxes/credits/adjustments, total, currency, source, and completeness.
- Distinguish estimated/unfinalized usage from provider-finalized billing documents.
- Surface invoice identifiers or downloadable documents only when the connected provider supplies them.
- Explain ingestion delay, missing attribution, unsupported breakdowns, and incomplete billing periods.

**Acceptance:** A user can identify the difference between a forecast, usage-cost report, and finalized invoice. No payment status is inferred from infrastructure usage totals.

### FR-13 — Alerts, notifications, changes, and audit [R1]

- Deduplicate threshold/anomaly alerts; support acknowledgment, resolution on recovery, and scoped mute windows without erasing history.
- Provide persistent per-user in-app notifications for attention items, approvals, and operation outcomes. Email delivery is included in R2.
- Offer a Changes page for approval requests, execution history, configuration diffs, and post-change observations.
- Record actor, approver, scope, target, source recommendation/AI draft, policy/pricing versions, timestamps, correlation IDs, and outcome.
- Make audit history append-only through application APIs, with filters, readable details, and export.

**Acceptance:** A user can follow an AI draft through human review, approval, provider execution, observed outcome, and audit events without gaps in identifiers.

### FR-14 — AI administration and data lifecycle [R1; indexed documents R2]

- Let Admins enable Copilot, configure allowed data sources, and set workspace AI usage budgets.
- Display request/token usage, estimated model spend, availability, and configured model identity.
- Support conversation deletion and documented retention; expired/deleted documents stop appearing in retrieval and citations after access revalidation.
- Evaluate AI and infrastructure budgets independently so a model usage limit does not change cloud-resource authorization.
- Keep replay/simulated source labels visible on responses and generated artifacts.

**Acceptance:** Exceeding the workspace AI limit disables new model runs with an explanation while monitoring, policies, and normal operations remain usable.

## 6. Intelligence design and defaults

### Responsibilities

| Layer | Responsibility | Output |
| --- | --- | --- |
| Deterministic analytics | Aggregate observations, calculate prices, evaluate policies, and resolve capabilities. | Reproducible facts and decisions. |
| Statistical / predictive intelligence | Detect unusual behavior and forecast demand/cost from sufficient history. | Deviations, forecasts, uncertainty, and candidate opportunities. |
| Generative AI | Interpret questions, retrieve permitted facts, explain results, and construct reviewable drafts. | Cited answers, summaries, and non-executing proposals. |
| Execution service | Verify authorization and execute a durable, versioned change. | Provider-confirmed configuration and outcome record. |

### Initial decision defaults

- Evaluate recommendations once per minute; require fresh observations and at least 80% coverage in the decision window.
- Scale-up candidate: latest 10-minute traffic average is at least 30% above the preceding 10 minutes, and CPU exceeds 75% or valid p95 latency exceeds its configured target over the latest window. Require a meaningful baseline, initially 100 requests/minute.
- For CPU-driven replica scaling, use `ceil(current replicas × observed CPU / target CPU)`, with a default 60% CPU target, then apply capability and policy bounds.
- Scale-down candidate: at least 30 minutes below 35% CPU and 50% memory, stable demand, and no active latency/health breach; begin with a one-replica reduction.
- Rightsizing advice: use at least seven days of adequate observations and a compatible catalog configuration retaining at least 30% headroom over measured peak demand. Quantify restart/migration requirements and price uncertainty.
- Idle advice: at least 24 hours of genuinely near-zero demand and CPU below 5% for services where those measurements are meaningful. Missing data is not idleness.
- Default cooldown is five minutes after a confirmed change, extendable for service stabilization.
- Recommendation and pending approval validity: 15 minutes. Executable preview validity: five minutes. Refresh evidence before renewing a proposal.
- Forecast eligibility: at least 28 days of adequately covered hourly history. Below that, display a baseline with explicit limits or Insufficient history.
- Anomaly labels describe statistical deviation; evidence quality labels are High, Moderate, or Insufficient. Percentage model confidence is shown only when calibrated and meaningful.

## 7. Measurement and financial definitions

| Measure | Definition |
| --- | --- |
| Request rate / count | Rate at a configured service boundary; integrate actual sample durations for period counts. Do not count both a service request and its downstream resource processing as separate user requests. |
| Average / p95 latency | Request-weighted mean; p95 from a valid distribution or provider aggregate. Do not average percentiles. |
| CPU / memory | Resource utilization plus capacity-weighted aggregates with allocation and coverage. |
| Storage | Used bytes and allocated bytes; percentage only when both are known. |
| Uptime | Successful valid probes divided by valid probes for the stated window, with separate coverage. Missing observations never count as successful. |
| Health | Healthy, Warning, Critical, or Unknown based on configured signals; independent of resource lifecycle. |
| Monthly run-rate | Estimated full-month cost of the proposed configuration, using a disclosed duration, initially 730 hours. |
| Month-end forecast | Incurred billing plus a disclosed estimate for the remaining billing period, with ingestion lag and uncertainty. |
| Budget headroom | Budget minus proposed period forecast and other outstanding positive commitments. |
| Savings | Non-overlapping estimated reduction in a specified period; realized savings require observed after-data and attribution context. |

## 8. End-to-end acceptance journeys

### Journey A — Increased traffic, AI explanation, and approved scaling

1. Production API has four replicas. A repeatable scenario produces a 34% traffic increase and 82% average CPU over a sufficiently covered 10-minute window.
2. A rule produces a six-replica candidate, with allowed bounds of two to eight and a maximum step of two.
3. The user asks Copilot, “Why should we scale this service?” It cites the traffic and CPU windows, explains the proposed capacity, and identifies any uncertainty about latency improvement.
4. The review shows an illustrative INR 4,200/replica/730-hour price: current INR 16,800/month, proposed INR 25,200/month, difference **+INR 8,400/month**.
5. With 365 hours left, incremental period cost is INR 4,200. A baseline INR 180,000 period forecast becomes INR 184,200 against an INR 200,000 budget, leaving INR 15,800 before other commitments.
6. An Operator submits the five-minute-valid preview. A production policy requires a separate Admin, who reviews current evidence and selects **Approve and apply** before request expiry.
7. The worker executes once, reconciles provider state, and confirms six replicas. The recommendation becomes Applied and audit events link the entire sequence.
8. Monitoring compares pre/post windows. The UI distinguishes “Capacity updated” from any later measured performance improvement.

The figures are an illustrative scenario, not a claim about actual provider pricing.

### Journey B — Cost investigation and optimization

The user asks why spending increased. Copilot retrieves comparable billing periods, identifies attributable increases with citations, and opens the appropriate breakdown. The user compares a lower-capacity option, sees the operational assumptions, and submits it only if policy and evidence checks pass. Overlapping savings are not added together.

### Journey C — Permission, budget, and AI failure paths

A Viewer can inspect a what-if result but cannot submit it. A budget-exceeding proposal shows its blocking rule. A model outage returns an explicit unavailable state while structured analysis continues. A retrieved resource name containing instructions cannot change tool authorization or trigger execution.

### Journey D — Stale evidence and ambiguous execution

A policy or resource changes during review, so CloudOps requires a new preview. A subsequent provider timeout enters Reconciling, reserves the unresolved commitment, and reads actual provider state before any repeat attempt. A partial outcome is visible and a revert requires its own review.

### Journey E — Forecast-assisted planning [R2]

A service with sufficient history receives a demand forecast and interval. The UI shows model accuracy against a baseline, compares capacity scenarios, and generates a pre-peak change proposal. The user authorizes it through the same change workflow.

## 9. Quality, reliability, and AI evaluation

| Area | Release target |
| --- | --- |
| Responsiveness | Core flows usable at 360, 768, 1280, and 1536 px; no page-level horizontal overflow. |
| Accessibility | WCAG 2.2 AA target, keyboard-complete workflows, visible focus, reduced motion, and accessible chart alternatives. |
| Interactive performance | In a documented reference environment with 100 resources, 30 days of rolled-up history, and 25 active sessions: usable overview within 3 seconds; normal aggregated read APIs p95 under 500 ms. Measure live SDK calls separately. |
| Freshness | New demo observations visible within 10 seconds; live data exposes its provider cadence and stale threshold. |
| AI latency | p95 first progress/stream event within 2 seconds and completed normal answer within 20 seconds under the evaluated model/tool configuration; bounded timeout with a useful status. |
| AI cost | Initial target p95 model cost below USD 0.10 per standard answer; measure provider-reported usage and enforce configurable workspace caps. |
| Forecast quality | A promoted model improves held-out error by at least 10% over its seasonal baseline; show prediction-interval coverage and revert to baseline on regression. |
| Availability [R2] | 99.9% monthly API read availability target, with published measurement exclusions and dependency metrics. |
| Recovery [R2] | Database RPO at most 15 minutes and RTO at most 4 hours, demonstrated through restore exercises. |
| Isolation and integrity | Server-authorized workspace boundaries, versioned evidence, decimal monetary calculations, UTC storage, and auditable idempotent operations. |

AI evaluation includes numerical correctness, source support, wrong-workspace requests, stale evidence, insufficient data, misleading document content, tool failures, and attempted action through chat. Zero unauthorized disclosure/action is a release gate in that suite. Human review complements automated grading; one model's self-scoring is not sufficient evidence of quality.

## 10. Delivery workstreams and definition of done

1. **Foundation:** workspace identity, contracts, PostgreSQL schema, scoped authorization, UI shell, CI, and reproducible local environment.
2. **Observation:** provider contract, simulator, service mapping, telemetry ingestion, aggregation, health, and monitoring screens.
3. **Decision:** cost ingestion/pricing, budgets, policies, recommendation evaluator, and what-if preview.
4. **Action:** approval requests, durable worker, provider reconciliation, notifications, and audit history.
5. **AI:** scoped read tools, model integration, cited conversation UI, brief generation, drafts, and evaluation corpus.
6. **Live and predictive:** AWS adapter, deployment/recovery, runbook retrieval, anomaly investigation, forecast training/backtests, and outcome measurement.
7. **Multi-cloud:** Azure/GCP adapters and explicitly policy-authorized automation.

Each workstream delivers API contracts, UI states, domain tests, observability, and an acceptance demonstration. R1 is complete only when Journeys A–D run end to end, including an actual LLM interaction and negative paths. R2 additionally requires a live AWS operation, billing reconciliation, Journey E, and documented recovery/model evaluation results.

## 11. PS-10 traceability

| Deliverable | Requirements | Main product surfaces |
| --- | --- | --- |
| Infrastructure/application metrics, traffic, latency, storage, uptime, health | FR-02–04, FR-08 | Overview, Resources, Monitoring |
| Resource management and scaling according to demand | FR-02, FR-05, FR-09 | Resources, Recommendations, Changes |
| Cost analysis, billing, financial impact | FR-09, FR-11–12 | Costs & Billing, shared change review |
| Intelligent allocation, scaling, and cost recommendations | FR-05–08 | Recommendations, Copilot, contextual insights |
| Policies, budgets, permissions, and safety limits | FR-01, FR-09–11 | Policies, Budgets, Changes, Settings |
| Authorized review and apply workflow | FR-09–10, FR-13 | Change review, approvals, execution timeline, audit |
| Unified multi-cloud abstraction | FR-02–04, FR-09, FR-12 | Connections, scoped views, common operations |
| Reduced overhead for non-specialists | FR-03, FR-06–07 | Plain-language dashboard, Copilot, guided action |

The visual specification is in [DESIGN.md](DESIGN.md). Technology decisions, data models, AI tool contracts, and delivery mechanics are in [TECH_STACK.md](TECH_STACK.md).

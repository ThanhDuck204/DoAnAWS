# Meeting Intelligence SaaS Pricing Model

This pricing model maps directly to the AWS-oriented architecture: S3 upload, EventBridge, Step Functions, Amazon Transcribe, Amazon Bedrock, DynamoDB, SNS, and CloudWatch. The main cost driver is audio minutes processed by Amazon Transcribe, so every plan includes explicit monthly audio limits and file-size guardrails. Member and team limits are treated as recommended operating boundaries in the mock product so demos stay flexible, while AI audio minutes remain strict to protect AWS credits.

## Market Patterns Referenced

| Pattern | Product references | How it maps here |
|---|---|---|
| Generous free trial experience | Fireflies and Fathom make basic capture and summarization easy to try | Free Pilot allows a realistic demo but caps raw audio processing tightly |
| Paid plans unlock workflow depth | Fathom and Fireflies add action items, templates, team features, and integrations | Business Ops adds speaker labels, evidence, task-board handoff, and export-ready recaps |
| Searchable meeting knowledge base | Fireflies, Fathom Team Edition, and Otter Business | Meeting history, searchable recaps, source quotes, and task evidence become paid value |
| Conversation intelligence and coaching | Avoma and Gong-style products add scorecards, risks, and analytics | Enterprise Governance keeps analytics, department insights, and custom meeting templates |
| Enterprise compliance controls | Fireflies Enterprise, Teams Premium admin patterns, and Asana Enterprise | SSO-ready policy, audit export, legal hold, retention, and data residency review |

## Profit-First Policy

| Policy | Why it improves margin | Product behavior |
|---|---|---|
| Strict AI minute caps | Amazon Transcribe is billed per processed audio minute, so every raw upload has real COGS | Free stops at quota; paid plans charge overage or require upgrade |
| Smaller included minutes, richer workflow | Customers pay for task evidence, search, governance, exports, and accountability, not only transcription volume | Business Ops sells operations value while keeping AWS usage bounded |
| Early usage alerts | Users can avoid waste before reaching hard limits | Alerts appear at 70, 85, and 95 percent of monthly AI minutes |
| Overage pricing above AWS cost | Heavy users fund their own incremental AWS usage | Business overage is priced at $0.09/minute |
| Enterprise committed use | Large customers should not consume unlimited credits on a flat demo price | Enterprise uses custom contracts, pooled credits, negotiated overage, and SLA |

## Plan Matrix

| Plan | Reference price | Target customer | Audio/month | Upload/file | Members | Workspace/team | Workflow outcome | History retention | AI features | Support | Security and admin |
|---|---:|---|---:|---:|---:|---|---|---|---|---|---|
| Free Pilot | $0 / 0 VND | Solo validation and product demos | 60 min | 50 MB | 3 recommended | 1 workspace, 1 team recommended | Capture a few meetings, generate basic summary, manually review suggested tasks | 30 days | Transcription, basic summary, up to 10 action items | Best-effort email/docs | Owner role, basic validation |
| Business Ops | $99 / ~2,490,000 VND per month | SMB teams running weekly operations and project reviews | 1,200 min | 150 MB | 20 recommended | 3 workspaces, 10 teams/workspace recommended | Convert recurring meetings into assigned tasks with source evidence and usage alerts | 365 days | Speaker labels, summary, decisions, risks, task evidence, search | Priority email, 1 business day target | Roles, permission audit, private invites, retention controls |
| Enterprise Governance | Custom | Departments and regulated companies | 6,000 min included by default, custom after contract | 350 MB | Unlimited | Unlimited / custom | Standardize meeting intelligence with department analytics, audit export, legal hold, and SSO-ready controls | Custom, up to 7 years | Business AI plus custom prompts, PII-aware workflow, analytics, export | Priority onboarding and custom SLA | SSO/SAML-ready, MFA policy, audit export, legal hold, dedicated AWS account option |

## Cost Control Mechanisms

| Cost risk | Guardrail | Implementation path |
|---|---|---|
| Amazon Transcribe overuse | Monthly audio minute quota per workspace | `billingService.validateMeetingProcessing` before creating a meeting job |
| Very large audio uploads | Plan-specific file size limit | Free 50 MB, Business 150 MB, Enterprise 350 MB |
| Duplicate uploads | File hash check before processing | Existing `storageService.computeFileHash` and duplicate warning |
| Bedrock token overuse | Summarization/task extraction only after quota pass | Future Lambda/Step Functions should call the same quota contract |
| Concurrent job spikes | Per-workspace active job limit | Existing `quotaService.checkJobConcurrency` |
| Storage growth | Retention per plan and S3 lifecycle | S3 Standard to Glacier lifecycle; deletion/retention policy by plan |
| Unexpected AWS spend | Budget alerts and soft/hard workspace limits | CloudWatch/AWS Budgets plus DynamoDB usage counters |

## AWS Unit Economics Assumptions

These numbers are planning assumptions and should be updated per AWS Region before production launch.

| Item | Assumption |
|---|---:|
| Amazon Transcribe | $0.024 per audio minute |
| Amazon Bedrock | $0.80 / 1M input tokens and $4.00 / 1M output tokens |
| Step Functions | $0.000025 per state transition |
| S3 Standard | $0.023 per GB-month |
| Average tokens | 750 input and 120 output tokens per audio minute |
| Workflow transitions | 8 state transitions per meeting |
| Platform overhead | $3 per workspace/month for API, storage, logs, notifications, and shared infra |

## Profitability Estimate

| Plan | Included minutes | Est. AWS variable cost | Buffered cost | Revenue | Margin strategy |
|---|---:|---:|---:|---:|---|
| Free Pilot | 60 | ~$1.46 | ~$4.82 | $0 | Treated as acquisition cost. Keep the trial useful but small enough to preserve AWS credits. |
| Business Ops | 1,200 | ~$29.06 | ~$45.13 | $99 | Healthier default margin; heavy users pay overage at $0.09/minute. |
| Enterprise Governance | 6,000 | ~$145.27 | ~$249.96 | Custom | Requires contract pricing, committed usage, fair-use limits, or negotiated overage. |

## Recommended Upsell Strategy

| Path | Trigger | Message | Upgrade value |
|---|---|---|---|
| Free Pilot to Business Ops | 70 percent monthly minutes used, file over 50 MB, fourth member invite, second team/workspace attempt | "Your team is outgrowing Free. Upgrade for longer meetings, more members, searchable history, and task evidence." | 1,200 minutes/month, 20 recommended members, 365-day history, speaker labels, task evidence |
| Business Ops to Enterprise Governance | 85 percent monthly minutes used for two cycles, more than 20 members, SSO/audit export request, custom retention need | "Move to Enterprise for governance, custom capacity, and SLA-backed operations." | Custom quota, SSO/MFA, legal hold, audit export, department analytics, dedicated AWS option |

## AWS-Friendly Data Model

| Entity | Future DynamoDB partition strategy |
|---|---|
| Workspace billing plan | `PK=WORKSPACE#{workspaceId}`, `SK=BILLING#PLAN` |
| Monthly usage | `PK=WORKSPACE#{workspaceId}`, `SK=USAGE#{yyyyMM}` |
| Processing job | `PK=WORKSPACE#{workspaceId}`, `SK=JOB#{jobId}` |
| Meeting metadata | `PK=WORKSPACE#{workspaceId}`, `SK=MEETING#{meetingId}` |
| Audit event | `PK=WORKSPACE#{workspaceId}`, `SK=AUDIT#{timestamp}` |

The frontend currently uses mock/local storage, but the service boundaries are shaped so a future API Gateway + Lambda + DynamoDB backend can reuse the same plan IDs, quota fields, and validation rules.

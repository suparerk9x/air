# The Devatar Framework v3

> *"See the system before you code"*
>
> **Devatar** = **Dev** + **Avatar** — Like Jake Sully learning Pandora before his mission, AI must fully understand the system (features, architecture, schema, rules) before generating a single line of code.
>
> AI-Assisted Development Governance System.
>
> Place this file alongside `prd.md` and `architecture.md` in `docs/`, then use it as a prompt foundation to generate a project-specific AI development system.

---

## Table of Contents

- [1. Core Principles](#1-core-principles)
- [2. System Architecture](#2-system-architecture)
- [3. Knowledge System](#3-knowledge-system)
- [4. Architecture Layer](#4-architecture-layer)
- [5. Workflow System](#5-workflow-system)
- [6. Feature Collision Detection](#6-feature-collision-detection)
- [7. Execution Layer — .claude/](#7-execution-layer)
- [8. Safety Layer](#8-safety-layer)
- [9. Automation & CI](#9-automation--ci)
- [10. Observability & Metrics](#10-observability--metrics)
- [11. Repository Structure](#11-repository-structure)
- [12. Devatar Decision Matrix](#12-devatar-decision-matrix)
- [13. AI Onboarding Prompt](#13-ai-onboarding-prompt)
- [14. How to Use This Document](#14-how-to-use-this-document)

---

## Problems This Framework Solves

| Problem | Root Cause | Framework Solution |
|---|---|---|
| Duplicate features | AI doesn't know what already exists | Feature Map + Collision Detection |
| Architecture drift | No enforceable rules | Architecture Rules + CI Guards |
| Fragmented knowledge | Docs fall out of sync with code | Knowledge Sync automation |
| Uncontrolled module growth | No module creation governance | Module justification rules |
| Stale documentation | Updates are manual afterthought | Post-implementation hooks |
| Unsafe AI code generation | No pre-generation checks | Safety Layer + Workflow enforcement |
| Wrong DB queries & schema | AI guesses column names and types | Database Schema Awareness + auto-gen |

---

## 1. Core Principles

### 1.1 Plan Before Code

AI must **never** jump directly to code generation. Every feature follows this pipeline:

```
Feature Request
  → Capability Awareness     (what does the system already do?)
  → Schema Awareness         (what does the database look like?)
  → Collision Detection      (does this overlap with existing features?)
  → Architecture Analysis    (where should this live?)
  → Implementation Plan      (how should it be built?)
  → Code Generation          (write the code)
  → Knowledge Update         (update system knowledge)
```

### 1.2 Capability Awareness

AI must understand what the system already does before implementing anything new.

Achieved through: Feature Map, Knowledge files, Database Schema, and Collision Detection.

Without this, AI tends to create redundant modules:

```
task-service      ← all doing
task-engine       ← roughly
task-manager      ← the same
task-handler      ← thing
```

### 1.3 Architecture Governance

Architecture rules must be **machine-verifiable**, not dependent on AI obedience.

Enforced via: architecture rules, automated checks, CI guards, and module validation scripts.

### 1.4 Knowledge as System State

Knowledge files represent the **live system state** — not static documentation.

They must stay synchronized with code, features, and architecture decisions.
They must be structured, versioned, and automatically validated.

### 1.5 AI Safety by Design

AI behavior is constrained by rules, automated checks, workflow enforcement, and CI validation.

Markdown instructions alone are **not sufficient**.

### 1.6 Devatar Runtime Loop

Every task — large or small — follows this cycle:

```
Understand → Plan → Execute → Verify → Learn
```

- **Understand** — Read the system state (knowledge, schema, architecture)
- **Plan** — Detect collisions, check rules, produce an implementation plan
- **Execute** — Write code following the plan
- **Verify** — Validate against architecture rules and tests
- **Learn** — Update knowledge files so the next cycle starts smarter

This loop never stops. Every feature, every fix, every refactor runs through it. The framework's layers exist to support this loop — not the other way around.

---

## 2. System Architecture

The framework consists of six layers, each addressing a different concern:

```
┌─────────────────────────────────┐
│       Observability Layer       │  ← Metrics & monitoring
├─────────────────────────────────┤
│         Safety Layer            │  ← Guardrails & constraints
├─────────────────────────────────┤
│        Execution Layer          │  ← Agents, commands, hooks
├─────────────────────────────────┤
│        Workflow Layer           │  ← Dev lifecycle pipeline
├─────────────────────────────────┤
│      Architecture Layer         │  ← Rules & boundaries
├─────────────────────────────────┤
│       Knowledge Layer           │  ← System state & feature map
└─────────────────────────────────┘
```

---

## 3. Knowledge System

**Purpose:** Provide AI with accurate understanding of the current system state.

### Directory Structure

```
knowledge/
├── index.md                  ← AI entry point
├── product.md                ← Product context
├── architecture-overview.md  ← Architecture summary
├── domain-model.md           ← Domain entities & relationships
├── feature-map.md            ← All system capabilities (powers collision detection)
├── database-schema.md        ← Live database schema (auto-generated from Supabase)
└── modules/
    ├── auth.md               ← Auth module knowledge
    ├── task.md               ← Task module knowledge
    └── billing.md            ← Billing module knowledge
```

### index.md — AI Entry Point

```markdown
# System Knowledge Index

This directory contains the authoritative system knowledge.
AI must read these files before any implementation work.

Essential files:
- product.md              → Product goals and context
- architecture-overview.md → System architecture
- domain-model.md         → Domain entities
- feature-map.md          → All existing capabilities
- database-schema.md      → Live database schema (tables, columns, types, relations)
- modules/*               → Per-module detail
```

### feature-map.md — System Capabilities

This file powers **collision detection**. It lists every feature the system provides.

```markdown
# Feature Map

## Authentication
- User registration
- Login (email + password)
- Password reset
- Session management

## Task Management
- Create task
- Update task
- Assign task to user
- Task comments
- Task status transitions

## Notifications
- Email notifications
- In-app notifications
- Notification preferences
```

### Module Knowledge Files

Each module has its own knowledge file describing responsibilities, features, and dependencies.

```markdown
# Module: Task

## Responsibilities
Task lifecycle management (create, update, assign, close).

## Features
- Create task
- Update task
- Assign task to user
- Task comments
- Task status transitions

## Dependencies
- Auth Module (user identity for assignment)
- Notification Module (notify on task changes)

## API Surface
- POST   /api/tasks
- PATCH  /api/tasks/:id
- POST   /api/tasks/:id/assign
- POST   /api/tasks/:id/comments
```

### database-schema.md — Live Database Schema

This file is **auto-generated** from Supabase and represents the actual database state.
AI must read this file before writing any query, migration, or data-related code.

**Why this matters:** Without schema awareness, AI commonly:
- Guesses column names (`user_id` vs `userId` vs `owner_id`)
- Creates duplicate tables
- Writes queries with wrong types (string vs uuid)
- Misses existing indexes, constraints, and RLS policies

```markdown
# Database Schema
> Auto-generated from Supabase. Do NOT edit manually.
> Last synced: 2025-03-09T10:00:00Z

## Tables

### users
| Column       | Type      | Nullable | Default          | Notes              |
|---|---|---|---|---|
| id           | uuid      | NO       | gen_random_uuid()| PK                 |
| email        | text      | NO       |                  | UNIQUE             |
| display_name | text      | YES      |                  |                    |
| role         | text      | NO       | 'member'         | enum: admin,member |
| created_at   | timestamptz | NO     | now()            |                    |

### tasks
| Column       | Type      | Nullable | Default          | Notes              |
|---|---|---|---|---|
| id           | uuid      | NO       | gen_random_uuid()| PK                 |
| title        | text      | NO       |                  |                    |
| status       | text      | NO       | 'pending'        | enum: pending,active,done |
| assignee_id  | uuid      | YES      |                  | FK → users.id      |
| created_by   | uuid      | NO       |                  | FK → users.id      |
| created_at   | timestamptz | NO     | now()            |                    |

## Relationships
- tasks.assignee_id → users.id (many-to-one)
- tasks.created_by → users.id (many-to-one)

## RLS Policies
- users: Users can read own profile. Admins can read all.
- tasks: Users can read tasks assigned to them or created by them.

## Indexes
- users_email_idx ON users(email)
- tasks_assignee_idx ON tasks(assignee_id)
- tasks_status_idx ON tasks(status)
```

### Supabase Schema Auto-Gen

The `database-schema.md` file is generated automatically by a script that connects to your Supabase project and extracts the live schema.

```
automation/schema-sync/
├── generate-schema.ts       ← Pulls schema from Supabase, writes database-schema.md
└── README.md                ← Setup instructions (Supabase URL + service key)
```

**How it works:**

```
npx ts-node automation/schema-sync/generate-schema.ts
```

1. Connects to Supabase via `pg_catalog` / `information_schema`
2. Extracts: tables, columns, types, defaults, constraints, foreign keys, indexes, RLS policies
3. Generates `knowledge/database-schema.md` in structured markdown
4. Logs last sync timestamp

**When to run:**
- Before starting any feature that touches the database
- After any migration
- As a CI step (optional — ensures schema docs never drift)

---

## 4. Architecture Layer

**Purpose:** Prevent architecture drift with explicit, enforceable rules.

### Directory

```
constraints/
└── architecture-rules.md
```

### Example Rules

```markdown
# Architecture Rules

RULE-01: Authentication logic must exist only in the Auth Module.
RULE-02: Task-related features must be implemented inside the Task Module.
RULE-03: Modules must not duplicate responsibilities.
RULE-04: New modules require written architecture justification.
RULE-05: Cross-module communication uses defined interfaces only.
RULE-06: Database access is scoped per module — no cross-module table queries.
```

---

## 5. Workflow System

**Purpose:** Define the required development lifecycle for every feature.

### Directory

```
workflow/
└── dev-workflow.md
```

### Standard Pipeline

```
Step 1  │ Feature Request           → Receive and clarify requirements
Step 2  │ Capability Awareness      → Read knowledge/index.md, feature-map.md
Step 2b │ Schema Awareness          → Read knowledge/database-schema.md
Step 3  │ Feature Collision Check   → Detect duplicates and overlaps
Step 4  │ Architecture Impact       → Analyze module boundaries and dependencies
Step 5  │ Implementation Plan       → Define approach, module, and steps
Step 6  │ Code Generation           → Write code following plan
Step 7  │ Knowledge Update          → Update feature-map.md and module files
Step 8  │ Validation                → Run architecture checks and tests
```

**Critical rule:** Steps 2–5 must complete before Step 6 begins.

**Schema rule:** If the feature involves database (queries, migrations, new tables), Step 2b is **mandatory**. AI must reference exact table names, column names, and types from `database-schema.md` — never guess.

---

## 6. Feature Collision Detection

**Purpose:** Detect duplicate features, overlapping capabilities, and architecture conflicts **before** code is written.

### Collision Check Prompt Template

```markdown
Before implementing this feature, analyze the system for conflicts.

**Feature Request:** [description]

**Tasks:**
1. Check if this feature (or similar) already exists in feature-map.md
2. Identify overlapping functionality in existing modules
3. Identify architecture rule conflicts
4. Recommend ONE of:
   - EXTEND: Add to an existing module
   - MODIFY: Change an existing feature
   - CREATE: New module (must include architecture justification)

**Reference files:**
- docs/prd.md
- docs/architecture.md
- knowledge/feature-map.md
- knowledge/database-schema.md
- knowledge/modules/*
```

### Expected Output Format

```markdown
## Collision Detection Report

### Existing Related Features
- [list any related features found]

### Duplication Risk
- HIGH / MEDIUM / LOW
- [explanation]

### Architecture Conflicts
- [any rule violations]

### Recommendation
- Action: EXTEND / MODIFY / CREATE
- Target Module: [module name]
- Justification: [reasoning]
- Implementation Steps: [numbered list]
```

---

## 7. Execution Layer

**Purpose:** Provide AI with structured agents, commands, hooks, and rules at runtime.

### Directory Structure

```
.claude/
├── agents/                   ← Structured reasoning tasks
│   ├── feature-planner.md
│   ├── architecture-analyzer.md
│   ├── implementation-agent.md
│   └── knowledge-maintainer.md
├── commands/                 ← Trigger workflows
│   ├── plan-feature.md
│   ├── check-feature.md
│   ├── implement-feature.md
│   └── update-knowledge.md
├── hooks/                    ← Automatic enforcement
│   ├── pre-implementation-check.md
│   └── post-implementation-update.md
├── skills/                   ← Reusable capabilities
└── rules/                    ← Behavioral constraints
```

### Agents

**Feature Planner** — Analyzes requests and determines implementation strategy.

```markdown
# Agent: Feature Planner

## Role
Analyze feature requests and produce implementation plans.

## Tasks
1. Read PRD for context
2. Read knowledge/feature-map.md for existing capabilities
3. Read knowledge/database-schema.md if feature touches data
4. Run collision detection
5. Identify related modules and dependencies
6. Produce implementation plan

## Output
- Related existing features
- Duplication risks (HIGH/MEDIUM/LOW)
- Recommended target module
- Step-by-step implementation plan
```

**Architecture Analyzer** — Validates module boundaries and detects violations.

```markdown
# Agent: Architecture Analyzer

## Role
Ensure implementation respects architecture rules.

## Tasks
1. Validate module boundaries against constraints/architecture-rules.md
2. Detect architecture violations in proposed changes
3. Suggest correct module placement
4. Flag cross-module dependency issues
```

**Knowledge Maintainer** — Keeps system knowledge synchronized with code.

```markdown
# Agent: Knowledge Maintainer

## Role
Update system knowledge after every implementation.

## Tasks
1. Detect newly added or changed features
2. Update knowledge/feature-map.md
3. Update relevant knowledge/modules/*.md files
4. Record design decisions and rationale
```

### Commands

Commands are user-triggered workflow actions:

| Command | Purpose |
|---|---|
| `/plan-feature` | Run Feature Planner agent for a feature request |
| `/check-feature` | Run Collision Detection only |
| `/implement-feature` | Execute full workflow (plan → build → update) |
| `/update-knowledge` | Run Knowledge Maintainer to sync docs |

### Hooks

Hooks enforce the workflow automatically — they cannot be skipped.

**Pre-Implementation Check** — Runs before any code generation:

```
1. Run collision detection against feature-map.md
2. Load and validate architecture rules
3. Confirm correct module placement
4. If DB-related: verify database-schema.md is loaded and referenced
5. BLOCK code generation if violations found
```

**Post-Implementation Update** — Runs after successful implementation:

```
1. Update feature-map.md with new capabilities
2. Update module knowledge files
3. Record design decisions
4. Log metrics (collision checks run, violations caught)
```

---

## 8. Safety Layer

**Purpose:** Enforce behavioral constraints on AI beyond just prompting.

### Directory

```
safety/
└── safety-guardrails.md
```

### Safety Rules

```markdown
# AI Safety Guardrails

SAFETY-01: AI must NOT create new modules without written architecture justification.
SAFETY-02: AI must run collision detection BEFORE implementing any feature.
SAFETY-03: AI must follow architecture rules defined in constraints/.
SAFETY-04: AI must update knowledge files AFTER every implementation.
SAFETY-05: AI must NOT modify module boundaries without explicit approval.
SAFETY-06: AI must NOT bypass pre-implementation checks.
SAFETY-07: AI must read database-schema.md BEFORE writing any query, migration, or data model code. Never guess column names or types.
```

---

## 9. Automation & CI

**Purpose:** Prevent knowledge drift and architecture violations through automated validation.

### Automation Directory

```
automation/
├── architecture-check/       ← Detect boundary violations
├── knowledge-sync/           ← Detect knowledge ↔ code drift
├── schema-sync/              ← Auto-generate database-schema.md from Supabase
└── feature-detection/        ← Detect undocumented features
```

### Architecture Validation

Detects: auth logic outside Auth Module, duplicate modules, cross-module boundary violations.

### Knowledge Sync

Compares codebase features against `knowledge/feature-map.md`.
If mismatch detected → suggest knowledge update.

### Schema Sync (Supabase)

Connects to Supabase, extracts live schema, and regenerates `knowledge/database-schema.md`.
Ensures AI always works with real table/column names, types, and constraints.

### CI Pipeline

```
CI Pipeline (runs on every PR)
─────────────────────────────────────
Step 1 │ Schema sync check              → database-schema.md matches live DB
Step 2 │ Architecture validation        → Check module boundaries
Step 3 │ Knowledge consistency check     → feature-map.md matches code
Step 4 │ Unauthorized module detection   → Flag unjustified new modules
Step 5 │ Lint rules                      → Code quality
Step 6 │ Tests                           → Unit + integration
─────────────────────────────────────
ANY violation → CI FAIL (merge blocked)
```

---

## 10. Observability & Metrics

**Purpose:** Make AI development quality measurable.

### Directory

```
metrics/
└── ai-dev-metrics.md
```

### Key Metrics

| Metric | What It Measures |
|---|---|
| Collision Checks Run | How often collision detection is triggered |
| Duplicate Features Prevented | Overlaps caught before implementation |
| Architecture Violations Detected | Rule violations caught by automation |
| Schema Drift Detected | Times database-schema.md was out of sync |
| Knowledge Updates | How reliably docs stay in sync |
| Planning Accuracy | How often plans match final implementation |

---

## 11. Repository Structure

Complete project layout:

```
project-root/
│
├── docs/                     ← 🟢 SOURCE FILES (you create these 3 files manually)
│   ├── prd.md                    ← Product Requirements Document
│   ├── architecture.md           ← System Architecture
│   └── The-Devatar-Framework.md  ← This file
│
│   ── Everything below is GENERATED by Claude Code ──
│
├── knowledge/                ← System state & capabilities
│   ├── index.md
│   ├── product.md
│   ├── architecture-overview.md
│   ├── domain-model.md
│   ├── feature-map.md
│   ├── database-schema.md        ← Auto-generated from Supabase
│   └── modules/
│       ├── auth.md
│       ├── task.md
│       └── billing.md
│
├── constraints/              ← Architecture rules
│   └── architecture-rules.md
│
├── workflow/                 ← Development lifecycle
│   └── dev-workflow.md
│
├── safety/                   ← AI behavioral constraints
│   └── safety-guardrails.md
│
├── automation/               ← Automated validation
│   ├── architecture-check/
│   ├── knowledge-sync/
│   ├── schema-sync/              ← Supabase → database-schema.md
│   └── feature-detection/
│
├── metrics/                  ← AI dev quality metrics
│   └── ai-dev-metrics.md
│
└── .claude/                  ← AI runtime system
    ├── agents/
    ├── commands/
    ├── hooks/
    ├── skills/
    └── rules/
```

### Source vs Generated

| Type | Location | Who Creates | Contents |
|---|---|---|---|
| **Source** | `docs/` | Human (you) | PRD, Architecture, this Framework |
| **Generated** | Everything else | Claude Code | Knowledge, constraints, workflow, safety, agents, etc. |

The 3 files in `docs/` are the **single source of truth**. Claude Code reads them and generates the entire AI Dev System from them.

---

## 12. Devatar Decision Matrix

**Purpose:** Not every project needs the full framework. The Decision Matrix tells AI which components to activate based on **actual project complexity** — minimal at start, scaling as the project grows.

> *"The framework is the complete blueprint. The Decision Matrix decides how much of it to build right now."*

### The 4 Variables

AI must assess these before activating any Devatar component:

| Variable | What to Measure |
|---|---|
| **Feature Count** | Number of distinct features in the system |
| **Module Count** | Number of separate modules/domains |
| **Engineer Count** | Number of people (human + AI) working on the codebase |
| **Architecture Complexity** | Depth of cross-module dependencies, external integrations |

### Activation Levels

#### Level 0 — Prototype

```
Conditions:  features < 10  ·  modules < 5  ·  engineers = 1
```

**Activate:**

```
docs/
  prd.md
  architecture.md
  The-Devatar-Framework.md

knowledge/
  feature-map.md
  domain-model.md
  database-schema.md          ← always include if using Supabase
```

**Do NOT activate yet:** `.claude/`, automation scripts, CI guards, observability

**Reason:** Project is still evolving. Heavy framework slows iteration. But feature-map and schema prevent the #1 AI mistake — building what already exists.

---

#### Level 1 — Early Product

```
Conditions:  features 10–20  ·  modules 5–10  ·  engineers 1–2
```

**Activate (add to Level 0):**

```
knowledge/
  index.md
  product.md
  architecture-overview.md
  modules/
    auth.md
    tasks.md
    ...
```

**Optional:** `constraints/architecture-rules.md`

**Still avoid:** automation scripts, CI guards, metrics

**Reason:** System capabilities are growing. Module-level knowledge prevents AI from creating overlapping code across modules.

---

#### Level 2 — Growing System

```
Conditions:  features > 20  ·  modules > 10  ·  engineers 2–3
```

**Activate (add to Level 1):**

```
constraints/
  architecture-rules.md

workflow/
  dev-workflow.md

safety/
  safety-guardrails.md

.claude/
  rules/
```

**Optional:** `.claude/agents/feature-planner.md`

**Reason:** Architecture drift becomes real at this scale. Need explicit rules and workflow to keep AI aligned. Multiple engineers need a shared process.

---

#### Level 3 — Scaling Team

```
Conditions:  features > 30  ·  modules > 15  ·  engineers > 3
```

**Activate (add to Level 2):**

```
.claude/
  agents/
  commands/
  hooks/

CI guards:
  .github/workflows/devatar.yml
```

**CI checks:** architecture violations, duplicate APIs, missing knowledge updates

**Reason:** Multiple engineers dramatically increase risk of inconsistency. CI guards enforce rules automatically — no human review bottleneck.

---

#### Level 4 — Large System

```
Conditions:  features > 50  ·  modules > 25  ·  engineers > 5
```

**Activate (add to Level 3):**

```
automation/
  architecture-check/
  knowledge-sync/
  schema-sync/
  feature-detection/
```

**Reason:** Manual maintenance is no longer sustainable. Automation prevents knowledge drift and catches architectural violations before they compound.

---

#### Level 5 — Platform Scale

```
Conditions:  features > 100  ·  modules > 40  ·  engineers > 10
```

**Activate (add to Level 4):**

```
metrics/
  ai-dev-metrics.md

.claude/
  agents/         ← full multi-agent system
  skills/
```

**Reason:** At platform scale, you need engineering visibility (metrics) and AI orchestration (multi-agent). Without observability, you can't measure framework effectiveness.

---

### Visual Summary

```
Level 0  Prototype       → feature-map + schema + domain-model
   ↓
Level 1  Early Product   → + module knowledge files
   ↓
Level 2  Growing System  → + architecture rules + workflow + safety
   ↓
Level 3  Scaling Team    → + CI guards + agents + hooks
   ↓
Level 4  Large System    → + automation scripts
   ↓
Level 5  Platform Scale  → + metrics + full agent system
```

### Key Principle

> The Devatar Framework document (this file) is always the **complete specification**.
> The Decision Matrix determines **how much to activate right now**.
>
> AI must always report:
> - **What was activated** and why
> - **What was NOT activated** and why
> - **When each deferred component should be introduced**
>
> This ensures the framework grows with the project — never ahead of it, never behind it.

### Note — Architecture Risk Override

> The Activation Level is a guideline, not a rigid rule.
>
> Architecture complexity can override the default activation level. Examples of high architectural risk include:
>
> - multi-tenant systems
> - strict row-level security (RLS)
> - distributed services
> - event-driven systems
> - heavy external integrations
> - financial or sensitive data handling
>
> In these cases, activating additional Devatar components earlier is recommended.
>
> Engineering judgment always overrides numeric thresholds.

---

## 13. AI Onboarding Prompt

Use this prompt when AI joins a repository that already has a Devatar system set up:

```
You are an AI software engineer operating inside The Devatar Framework.

This project uses a Devatar Activation Level [0–5].
Only components for the current level are active.
Read the Devatar Activation Report to understand what is active and what is deferred.

Before implementing ANY feature, you MUST:

1. Read docs/prd.md                     → Understand product goals
2. Read docs/architecture.md            → Understand system design
3. Read knowledge/index.md              → Understand current system state
4. Read knowledge/database-schema.md    → Understand exact DB tables, columns, types
5. Follow workflow/dev-workflow.md       → Follow the required development lifecycle
6. Run feature collision detection      → Check for duplicates and conflicts
7. Follow constraints/architecture-rules.md → Respect module boundaries

(Steps 3–7 apply only if those components are activated at the current level.
 If a component is not yet active, skip that step but note it in your plan.)

NEVER generate code before completing planning and analysis.
NEVER guess database column names or types — always reference database-schema.md.

After implementation:
8. Update knowledge/feature-map.md      → Register new capabilities
9. Update relevant knowledge/modules/*  → Keep module docs current
10. Run validation                      → Confirm no architecture violations

If the project has grown beyond its current Activation Level,
flag this in your response and recommend level-up.
```

---

## 14. How to Use This Document

### Setup

1. Create a `docs/` directory in your project root with these 3 files:

```
docs/
├── prd.md                       ← Your product requirements
├── architecture.md              ← Your system architecture
└── The-Devatar-Framework.md     ← This file
```

2. Prompt Claude Code to generate The Devatar system:

```
You are an elite AI Software Architect operating within
The Devatar Framework.

Devatar is an adaptive AI engineering system.
It must remain MINIMAL at the beginning and evolve
as the project grows.

Your job is to bootstrap a Devatar AI development system
for this repository.

The repository contains:

  docs/prd.md
  docs/architecture.md
  docs/The-Devatar-Framework.md

These files are the source of truth.


────────────────────────────────
STEP 1 — Understand the Project
────────────────────────────────

Read carefully:

  docs/prd.md
  docs/architecture.md

Extract:

  • system purpose
  • major modules
  • technology stack
  • expected feature scope
  • architectural risk
  • persistence layers (DB, APIs, etc)

Estimate:

  Feature Count
  Module Count
  Engineer Count
  Architecture Complexity


────────────────────────────────
STEP 2 — Devatar Decision Matrix
────────────────────────────────

Read Section 12 of docs/The-Devatar-Framework.md
(Devatar Decision Matrix).

Determine the Devatar Activation Level (0–5).

Assess:

  Feature Count
  Module Count
  Engineer Count
  Architecture Complexity


────────────────────────────────
STEP 3 — Devatar Activation Report
────────────────────────────────

Produce a report BEFORE generating any files.

  ## Devatar Activation Report

  ### Project Assessment

  Feature Count:
  Module Count:
  Engineer Count:
  Architecture Complexity:
  Activation Level:

  ### Components Activated

  For each component explain:

    What it is
    Why it is required now
    What problem it prevents

  ### Components Deferred

  For each deferred component explain:

    Why it is deferred
    What trigger activates it
    What risk exists


────────────────────────────────
STEP 4 — Devatar System Design
────────────────────────────────

Design the minimal Devatar system.

Possible components:

  .claude/
      agents/
      commands/
      hooks/
      skills/
      rules/

You MUST NOT automatically create everything.

Only include components justified by the Activation Report.


────────────────────────────────
STEP 5 — Align with Devatar Runtime Loop
────────────────────────────────

All generated components must support
the Devatar Runtime Loop:

  Understand → Plan → Execute → Verify → Learn

Examples:

  Understand
  → read PRD, architecture, knowledge files

  Plan
  → task-planning skill

  Execute
  → feature implementation agent

  Verify
  → architecture rules and hooks

  Learn
  → update knowledge files


────────────────────────────────
STEP 6 — Generate Devatar System
────────────────────────────────

Generate the minimal system.

Example structure:

  .claude/

    agents/
      architect.md
      feature-implementer.md
      code-reviewer.md

    commands/
      plan-feature.md
      implement-feature.md
      review-code.md

    hooks/
      pre-edit-check.md
      pre-commit-architecture-check.md

    skills/
      task-planning.md
      architecture-check.md

    rules/
      architecture-rules.md
      coding-rules.md
      safety-guardrails.md

Each component must be clearly defined.


────────────────────────────────
STEP 7 — Future Expansion Plan
────────────────────────────────

Provide triggers for activating the next Devatar level.

Examples:

  "When features exceed 20, introduce architecture rules."
  "When engineers exceed 3, activate CI guards."
  "When modules exceed 25, introduce automation scripts."


────────────────────────────────
IMPORTANT PRINCIPLES
────────────────────────────────

1. Devatar must remain minimal initially
2. Do not create unnecessary systems
3. Every component must solve a real problem
4. The system must evolve as the project grows
5. Do not modify the files in docs/ — they are the source of truth
```

### What This Produces

A working Devatar system where:

- `docs/` contains your **3 source files** (human-authored, rarely changed)
- The Activation Report explains **what was included, what was deferred, and why**
- All components align with the **Devatar Runtime Loop** (Understand → Plan → Execute → Verify → Learn)
- Only components justified by **actual project complexity** are generated
- Future expansion triggers are documented — you know exactly **when to level up**
- The framework grows with the project — never ahead of it, never behind it

The Devatar Framework transforms AI coding from **uncontrolled generation** into a **structured engineering system** — see the system before you code.

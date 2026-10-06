# AgentChecker

### Agent Reliability Harness

**Measure whether an AI agent behaves as expected — instead of assuming it does.**

AgentChecker is a web-based reliability harness for evaluating AI-agent source code and configuration against a collection of deterministic checks.

It is designed to help developers identify reliability issues early by making agent behavior easier to inspect, validate, and reason about.

---

## Overview

AI agents can appear correct during normal usage while still containing hidden reliability problems.

An agent may:

- make incorrect decisions under specific conditions
- violate an expected behavioral rule
- contain configuration problems
- produce inconsistent or unsafe implementation patterns
- behave differently when edge cases are introduced
- pass a simple demonstration while failing a more targeted check

AgentChecker provides a structured way to evaluate these concerns.

Instead of relying only on manual inspection, the application runs a collection of defined checks against the supplied agent source/configuration and presents the results in a clear interface.

The goal is not to claim that an agent is universally "safe" or "correct."

The goal is to provide **repeatable evidence about the checks that were actually performed.**

---

## Key Features

### Deterministic Reliability Checks

AgentChecker includes a built-in catalog of reliability checks.

Each check evaluates a specific condition and produces a structured result.

This makes results easier to reproduce and compare than purely subjective manual reviews.

### Custom Rules

In addition to the built-in checks, AgentChecker supports custom rules.

Custom rules can be created and stored in the browser, allowing developers to define project-specific validation requirements without modifying the core application.

### Clear Check Results

The interface organizes results so developers can quickly understand:

- what was checked
- whether the check passed
- what was detected
- the severity of the finding
- which areas require attention

### Reliability-Focused Workflow

The application is designed around a simple workflow:

```text
Agent Source / Configuration
            ↓
       Check Engine
            ↓
    Individual Checks
            ↓
      Check Results
            ↓
   Reliability Overview
```

### Browser-Based Experience

AgentChecker provides a web interface rather than requiring developers to interact with a command-line tool.

This makes the results easier to inspect, demonstrate, and review.

---

## What AgentChecker Does

At a high level, AgentChecker performs deterministic analysis against the agent information provided to it.

The application:

1. Accepts agent-related source or configuration information.
2. Runs the available reliability checks.
3. Evaluates each check independently.
4. Produces structured results.
5. Displays the findings through the web interface.
6. Allows additional custom rules to be defined and retained locally in the browser.

The system is intended to make reliability checks explicit and reviewable.

---

## What AgentChecker Does Not Claim

AgentChecker is intentionally designed with clear boundaries.

A successful check does **not** mean that an AI agent is guaranteed to be safe, correct, secure, or reliable in every possible situation.

In particular, the current project should not be interpreted as:

- a guarantee of AI-agent correctness
- a complete security scanner
- a replacement for application testing
- a replacement for human review
- a benchmark of model intelligence
- a framework-specific agent runtime
- a LangGraph execution engine
- a production sandbox
- a guarantee against prompt injection or other attacks

The results represent the conditions that were evaluated by the implemented checks.

This distinction is important when using reliability tooling responsibly.

---

# Why Agent Reliability Matters

Traditional software testing generally evaluates whether predefined inputs produce expected outputs.

AI agents introduce additional complexity because their behavior can depend on:

- instructions
- available tools
- configuration
- decision logic
- external context
- model behavior
- edge cases
- intermediate decisions

A system can therefore appear functional while still having reliability weaknesses.

AgentChecker focuses on making some of these reliability requirements explicit.

The underlying principle is:

> **Do not assume an agent works because it worked once. Test the behavior you actually care about.**

---

# Architecture

AgentChecker is implemented as a modern frontend application.

The current repository uses:

- **React** for the user interface
- **TypeScript** for type-safe application logic
- **Vite** for development and production builds
- **Vitest** for automated testing
- **ESLint** for code quality
- **Prettier** for formatting
- **Tailwind CSS** for styling
- **Radix UI** components for accessible interface primitives
- **React Router / TanStack Router** for application routing
- **Zod** for schema validation
- **Recharts** for data visualization where required

These dependencies are defined in the project's package configuration.

---

## High-Level Architecture

```text
                    ┌──────────────────────┐
                    │      User Input      │
                    │ Agent Source / Rules │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Check Engine      │
                    │                      │
                    │ Built-in Checks      │
                    │ Custom Rules         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Check Evaluation   │
                    │                      │
                    │ Pass / Warning /     │
                    │ Failure / Findings   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Result Processing  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     Web Interface    │
                    │                      │
                    │ Results              │
                    │ Findings             │
                    │ Custom Rules         │
                    │ Reliability Overview │
                    └──────────────────────┘
```

---

# Check Model

AgentChecker treats individual reliability requirements as independent checks.

A conceptual check can be represented as:

```text
Check
 ├── Identifier
 ├── Description
 ├── Severity
 ├── Evaluation Logic
 └── Result
```

A check should provide an understandable reason for its result rather than simply producing a numerical score.

This makes the output more useful for debugging and review.

---

# Built-in Checks

The application includes a built-in check catalog for evaluating common reliability conditions.

The check architecture is designed so that individual checks can be evaluated independently.

A typical result can communicate:

```text
PASS
The agent satisfies the evaluated requirement.
```

or:

```text
WARNING
The implementation contains a condition that may require review.
```

or:

```text
FAIL
The evaluated requirement was not satisfied.
```

The exact checks and their implementation are defined by the source code in the repository.

---

# Custom Rules

AgentChecker also supports user-defined reliability rules.

This is useful when a project has requirements that are not covered by the built-in catalog.

For example, a development team might define a rule such as:

```text
An agent must not call a destructive operation
without an explicit confirmation step.
```

Another project might define:

```text
The agent must validate required parameters
before executing a tool operation.
```

Custom rules allow the reliability harness to adapt to the requirements of different projects.

Custom rule information is stored locally in the browser rather than requiring a separate backend service.

---

# Deterministic Evaluation

A core design principle of AgentChecker is deterministic evaluation.

The purpose is to make a given check produce a predictable result for the same analyzed input and rule definition.

This is useful because it allows developers to:

- reproduce findings
- compare changes
- validate fixes
- understand why a check failed
- build confidence in the testing process

Deterministic checks should be distinguished from probabilistic evaluation performed by an AI model.

AgentChecker's reliability checks should therefore be understood as **implemented software checks**, not as a measurement of the intelligence or quality of a particular language model.

---

# Typical Workflow

A developer can use AgentChecker as part of an agent development workflow.

### 1. Develop the Agent

Create or modify the AI agent and its configuration.

### 2. Define Reliability Requirements

Identify behaviors that the agent should consistently satisfy.

Examples include:

- correct tool usage
- required validation
- expected configuration
- prohibited behavior
- project-specific constraints

### 3. Run AgentChecker

Open the AgentChecker application and evaluate the relevant agent information.

### 4. Review Findings

Inspect the individual check results.

Do not treat the overall result as sufficient evidence by itself.

Review the underlying findings and determine whether the reported condition is relevant.

### 5. Fix the Agent

Modify the implementation or configuration where necessary.

### 6. Run the Checks Again

Re-evaluate the agent after changes.

The goal is to verify that the specific reliability issue has actually been addressed.

---

# Example Reliability Scenario

Consider an agent that can perform an account-management operation.

A reliability requirement might be:

```text
The agent should request confirmation before
performing a destructive action.
```

A corresponding check could evaluate whether the implementation contains the expected confirmation behavior.

Conceptually:

```text
                Agent
                  │
                  ▼
        ┌──────────────────┐
        │ Destructive Tool │
        │     Available    │
        └────────┬─────────┘
                 │
                 ▼
       ┌────────────────────┐
       │ Confirmation Logic │
       └────────┬───────────┘
                │
          ┌─────┴─────┐
          │           │
        Present      Missing
          │           │
          ▼           ▼
        PASS         FAIL
```

The important point is that the harness evaluates a **specific requirement** rather than making a broad claim about the entire agent.

---

# Project Structure

The repository follows a frontend-oriented TypeScript structure.

A simplified view is:

```text
AgentChecker/
│
├── public/
│
├── src/
│   ├── components/
│   ├── checks/
│   ├── routes/
│   ├── lib/
│   └── ...
│
├── AGENTS.md
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── eslint.config.js
├── .prettierrc
├── components.json
├── bunfig.toml
└── bun.lock
```

The exact implementation structure may evolve as the project develops.

---

# Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Application logic and type safety |
| Vite | Development server and build tooling |
| Tailwind CSS | Styling |
| Radix UI | UI primitives |
| TanStack Router | Application routing |
| Zod | Validation and structured data |
| Recharts | Charts and visualizations |
| Vitest | Automated testing |
| ESLint | Static code analysis |
| Prettier | Code formatting |

The repository's current `package.json` defines React 19, TypeScript, Vite, Vitest, Tailwind CSS, Zod, Recharts, Radix UI and related tooling.

---

# Requirements

Before running the project locally, install:

- **Node.js**
- **npm**

The repository currently defines npm scripts for development, building, testing, linting, formatting, and previewing the application.

---

# Installation

Clone the repository:

```bash
git clone https://github.com/knight9572/AgentChecker.git
```

Enter the project directory:

```bash
cd AgentChecker
```

Install dependencies:

```bash
npm install
```

---

# Running the Development Server

Start the Vite development server:

```bash
npm run dev
```

Vite will provide a local development URL in the terminal.

Open that URL in your browser.

---

# Production Build

Create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

# Testing

Run the automated test suite:

```bash
npm test
```

For continuous test execution during development:

```bash
npm run test:watch
```

Testing is powered by Vitest.

---

# Code Quality

Run ESLint:

```bash
npm run lint
```

Format the project using Prettier:

```bash
npm run format
```

These commands help maintain consistent code quality and formatting throughout the project.

---

# Development Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run build:dev` | Create development-mode build |
| `npm run preview` | Preview production build |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run format` | Format source files |

These scripts are defined in the project's package configuration.

---

# Validation Before Submission

Before opening a pull request or presenting a new version, run:

```bash
npm test
npm run lint
npm run build
```

A successful validation should confirm that:

1. The automated tests complete successfully.
2. ESLint reports no blocking issues.
3. The production build completes successfully.

---

# Responsible Use

AgentChecker is intended to support software development and reliability engineering.

It should be used as one part of a broader engineering process.

For important systems, reliability validation should be combined with:

- unit testing
- integration testing
- end-to-end testing
- security review
- human review
- appropriate access controls
- monitoring
- production safeguards

A passing AgentChecker result should never be interpreted as proof that an AI system is completely reliable or secure.

---

# Security Considerations

Do not provide sensitive credentials, API keys, passwords, private tokens, or other confidential information to the application unless the implementation explicitly requires and securely handles them.

When evaluating an agent:

- use test data where possible
- avoid unnecessary production credentials
- review what information is being analyzed
- avoid uploading confidential source code to untrusted environments
- review custom rules before relying on their results

The reliability harness should complement, not replace, standard security practices.

---

# Design Principles

AgentChecker is guided by several principles.

### 1. Evidence Over Assumptions

A reliability claim should be connected to an actual check.

### 2. Deterministic Where Possible

Checks should produce reproducible results for the same inputs.

### 3. Explainable Findings

A developer should be able to understand why a check produced its result.

### 4. Extensibility

The system should allow additional checks and project-specific rules.

### 5. Clear Scope

The application should not claim to test behaviors that it does not actually evaluate.

### 6. Human Oversight

Automated checks support engineering decisions; they do not replace them.

---

# Limitations

The current project is a reliability-checking web application rather than a complete AI-agent execution environment.

Therefore, results can be affected by the scope and implementation of the available checks.

Important limitations include:

- not every possible agent behavior can be evaluated
- static checks may not capture runtime behavior
- a passing check does not guarantee correct behavior in production
- custom rules depend on the quality of their definitions
- model-level behavior is not automatically equivalent to source-level behavior
- external services and runtime environments may introduce conditions that are not represented by local checks

These limitations are expected for a reliability harness and should be considered when interpreting results.

---

# Future Improvements

Potential areas for future development include:

- expanded reliability check libraries
- richer check configuration
- import/export of custom rule sets
- detailed historical result tracking
- reliability trend visualization
- CI/CD integration
- machine-readable reports
- project-level configuration
- additional agent framework support
- runtime scenario testing
- configurable severity levels
- improved developer diagnostics

These are potential directions rather than claims about functionality currently implemented in the repository.

---

# Contributing

Contributions are welcome.

A typical contribution workflow is:

```bash
git clone https://github.com/knight9572/AgentChecker.git
cd AgentChecker
npm install
npm run dev
```

Before submitting changes, validate the project:

```bash
npm test
npm run lint
npm run build
```

When adding a new reliability check, aim to keep it:

- deterministic
- focused on one requirement
- understandable
- independently testable
- explicit about its limitations

Avoid checks that produce broad claims without clear evidence.

---

# Roadmap

AgentChecker can evolve from a collection of deterministic checks into a broader reliability engineering toolkit.

Potential roadmap:

```text
Current
  │
  ├── Deterministic Checks
  ├── Built-in Check Catalog
  └── Custom Browser Rules
        │
        ▼
Next
  │
  ├── More Reliability Checks
  ├── Rule Management
  ├── Reports
  └── Historical Results
        │
        ▼
Future
  │
  ├── CI/CD Integration
  ├── Runtime Scenario Testing
  ├── Framework Integrations
  └── Reliability Regression Tracking
```

---

# Project Status

AgentChecker is an actively developed project.

The current implementation focuses on providing a clear interface for deterministic AI-agent reliability checks and custom rule definitions.

Capabilities described in this README are intentionally limited to functionality represented by the current implementation. As new functionality is added, the documentation should be updated accordingly.

---

# License

See the repository for the applicable license information.

---

## Acknowledgements

AgentChecker is built using the open-source JavaScript and TypeScript ecosystem, including React, Vite, Tailwind CSS, Vitest, Radix UI, Zod, and other open-source libraries.

---

## Author

**AgentChecker**

GitHub repository:

https://github.com/knight9572/AgentChecker

---

## Summary

AgentChecker provides a practical way to approach AI-agent reliability through explicit, repeatable checks.

Rather than asking:

> "Does this agent seem to work?"

AgentChecker encourages a more useful engineering question:

> **"What reliability requirements can we define, test, and verify?"**

That distinction is the foundation of the project.

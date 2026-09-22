# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript with Vanilla CSS / CSS Modules (backend: FastAPI with SQLite & scikit-learn)

## Users

District Administration, Vigilance & Audit Officers, and Central/State Oversight Officials (such as MoSPI and District Collectors/Magistrates) monitoring MPLADS (Member of Parliament Local Area Development Scheme) project execution.

## Product Purpose

Detects anomalies, financial mismatches, timeline delays, and overlapping/duplicate works in MPLADS public expenditure. Synthesizes risk intelligence into explainable investigation dossiers to prioritize human field verification and audit actions. Tagline / Operating Principle: "AI Flags. AI Explains. Humans Verify."

## Positioning

Unlike generic reporting dashboards that only display static status or simplistic KPI aggregations, Mantri Drishti computes multidimensional behavioural fingerprints and fuses four distinct analytical engines (Deterministic Rules, Unsupervised Isolation Forest, Multi-signal Spatial/Textual Similarity, and IQR-based Peer Benchmarking) with calibrated Confidence scores. It outputs human-readable explanations ("Why Flagged") and actionable field inspection checklists rather than black-box alarms or premature accusations of wrongdoing.

## Operating Context

- Macro executive reviews by monitoring authorities to identify geographic, temporal, and categorical risk patterns across states, districts, and work types.
- Investigative drill-downs by audit and vigilance officers evaluating individual flagged projects.
- Field verification scheduling based on objective evidence (expenditure vs progress gaps, delay days, contractor clustering, and geographic proximity to other sanctioned works).
- Synthetic demonstration data in V1 with statutory disclaimers ensuring responsible AI governance ("Risk signals for human verification. Not proof of fraud.").

## Capabilities and Constraints

- Capabilities:
  - Macro executive overview: Total projects, attention-required count, high-risk signals, delay tracking, potential overlap count, risk distribution (low, medium, high, critical), top states by risk, work type breakdown.
  - Ranked project list with multi-parameter filtering (state, district, constituency, work type, risk score range) and sorting.
  - 5-Dimensional Project Fingerprints: Financial, Progress, Temporal, Geographic, Entity.
  - Multi-engine Risk Fusion: Rule Engine (35%), Isolation Forest (30%), Similarity Engine (15%), Peer Benchmarking (20%).
  - Transparent Confidence Scoring (data completeness + signal agreement, 0–100%).
  - Detailed Investigation Dossiers with structured evidence, peer distributions, candidate duplicate works, and recommended verification steps.
- Constraints:
  - V1 backend is FastAPI with local SQLite (`mantri_drishti.db`) and scikit-learn.
  - Synthetic dataset (~80 projects across 6 states) clearly demarcated for demonstration purposes.
  - Statutory disclaimer mandatory on all dossiers.

## Brand Commitments

- Name: Mantri Drishti (V1.0.0)
- Identity & Voice: Authoritative, vigilant, objective, institutional yet modern. High-credibility civic intelligence.
- Core philosophy: "AI Flags. AI Explains. Humans Verify."
- Tone: Rigorous, analytical, non-accusatory, focused on actionable verification rather than definitive claims of fraud.

## Evidence on Hand

- Seed dataset generator: `backend/generate_data.py` generating 80 synthetic projects across 6 states (Rajasthan, Maharashtra, Uttar Pradesh, Tamil Nadu, Karnataka, Madhya Pradesh) and 10 work types.
- Generated sample data: `backend/data/sample_projects.csv`.
- SQLite database: `backend/mantri_drishti.db` with populated `projects` and `risk_assessments` tables.
- Fully functional REST API running via FastAPI (`backend/app/main.py`) with complete endpoints for overview, projects, fingerprints, risk breakdowns, and dossiers.

## Product Principles

1. AI Flags, AI Explains, Humans Verify: The platform never makes definitive accusations of fraud; it surfaces statistically robust risk signals, explains the exact contributing reasons, and guides field inspectors to verify truth on the ground.
2. Multi-Signal Rigor over Black-Box Scoring: Single indicators (like delays or spending spikes) are never enough on their own. High risk requires convergence across deterministic rules, unsupervised machine learning, peer benchmarking, and contextual overlap checks.
3. Radical Transparency in Risk & Confidence: Every risk score is accompanied by a confidence score reflecting data completeness and signal agreement, plus an itemized breakdown of contributing engines.
4. Actionability Over Passive Observation: Every flagged project terminates in an actionable, practical field investigation dossier with recommended physical and financial verification steps.

## Accessibility & Inclusion

WCAG 2.1 AA compliance: High-contrast data visualization, accessible tables with keyboard navigation, clear visual indicators that do not rely solely on color to convey risk levels (combining badges, labels, and icons).

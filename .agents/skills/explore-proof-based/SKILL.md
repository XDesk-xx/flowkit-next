# Explore Proof-Based Skill v2

## Purpose

Execute Explore as a proof-based investigation before any Proposal.

Explore answers:

Can this change be safely proposed?

Explore does not:
- implement production changes
- create final design
- decide authority
- approve execution

## Authority Boundary

Policy decides whether an Action is legal.

Skill only defines HOW to perform Explore.

Explore Result is evidence, not approval.

## Core Principle

Every important claim must map:

Risk
→ Question
→ Proof
→ Evidence
→ Boundary

Do not treat:
- example success as universal proof
- current environment success as detached proof
- test pass as acceptance closure without boundary analysis

## Process

### 1. Establish Facts

Collect:

- repository state
- current contract
- existing specs
- relevant code/tests
- environment facts

Separate:

Known facts
Assumptions
Unknowns

### 2. Risk Scan

Always consider:

- scope expansion
- authority conflict
- persistence/state impact
- migration impact
- compatibility impact
- verification closure
- future consumer impact

### 3. Proof Planning

For each important risk define:

Question:
What uncertainty must be removed?

Evidence:
What observation answers it?

Boundary:
What does this evidence NOT prove?

### 4. Execute Minimum Proof

Allowed:

- targeted source inspection
- controlled experiment
- fixture
- focused test
- prototype

Forbidden:

- unrelated refactor
- production mutation
- architecture expansion

### 5. Result Contract

Output:

- Problem
- Facts
- Risks
- Proof performed
- Evidence
- Limitations
- PASS / FAIL / UNKNOWN

## Stop Conditions

Stop when:

- required authority is missing
- proof cannot support conclusion
- scope cannot be bounded

Never convert UNKNOWN into PASS.

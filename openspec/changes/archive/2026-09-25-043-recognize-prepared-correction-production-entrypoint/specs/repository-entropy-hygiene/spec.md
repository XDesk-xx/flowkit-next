## MODIFIED Requirements

### Requirement: Stable repository entropy hygiene command
Repository SHALL expose one stable repository-local entropy-hygiene command that evaluates production-source reachability and exits non-zero when any resolved `src` source module is outside the reachable closure of the exact production roots.

The exact current production roots SHALL be:

- `src/cli/entrypoint.ts`
- `src/domain/index.ts`
- `src/cli/prepared-owner-correction-start.ts`

The third root is the manager-distributed direct entrypoint invoked by the prepared-correction revise Skills; its production liveness SHALL NOT depend on an import from either of the other roots.

#### Scenario: Healthy production graph passes
- **WHEN** every resolved `src` source module is reachable from at least one exact production root
- **THEN** the entropy-hygiene command MUST exit successfully

#### Scenario: Directly invoked prepared correction entrypoint is live
- **WHEN** the prepared correction entrypoint is present in the production graph and has no incoming import from the other exact roots
- **THEN** the entropy-hygiene command MUST include it and its local `src` dependency closure in the reachable set

#### Scenario: Missing exact production root fails closed
- **WHEN** any exact production root is absent from the resolved production graph
- **THEN** the entropy-hygiene command MUST exit non-zero and identify the missing root

#### Scenario: Unreachable production source fails
- **WHEN** any resolved `src` source module is not reachable from any exact production root
- **THEN** the entropy-hygiene command MUST exit non-zero and identify the unreachable production source module

### Requirement: Production liveness is defined by production-root reachability
A production source module SHALL be considered live only when it belongs to the local `src` dependency closure reachable from at least one exact production root.

The capability SHALL NOT treat an isolated/no-edge property as equivalent to production-root unreachability, and references originating only from tests/specs SHALL NOT make a production source module live.

#### Scenario: Internally connected dead subgraph fails
- **WHEN** two or more `src` source modules depend on each other but none is reachable from any production root
- **THEN** every module in that unreachable production subgraph MUST be reported as an entropy finding and the command MUST fail

#### Scenario: Test-only reference does not create production liveness
- **WHEN** a `src` source module is referenced by tests/specs but remains unreachable from all production roots
- **THEN** the module MUST remain an entropy finding and the command MUST fail

## 1. Explore artifact identity

- [x] 1.1 Add a narrow validator for the exact current-Change Explore path, SHA and regular no-link file; verify it rejects wrong paths, malformed hashes, links, missing files and byte drift in focused tests.
- [x] 1.2 Add read-only compatibility resolution for an already-confirmed terminal successful Explore / Revise Explore Result only when both dedicated fields are absent and `artifactHashes` has one exact Explore entry; verify MenDi-shaped success and ambiguous, partial and conflicting identities with fixtures.

## 2. Fixed command boundaries

- [x] 2.1 Make `action finish` require and validate both dedicated fields for each new terminal successful Explore / Revise Explore before the first machine-file write; verify a candidate with only `artifactHashes` is rejected while its prepared `action.md` and artifact bytes remain unchanged.
- [x] 2.2 Make `review-explore` readiness use the strict legacy resolver for an accepted predecessor and retain declared-proof and Policy checks; verify a MenDi-shaped immutable fixture can start Review and invalid predecessors create no Reviewer start record.

## 3. Convergence and verification

- [x] 3.1 Run focused CLI regression tests, typecheck and strict OpenSpec validation; verify the real MenDi `012-explore/result.json` SHA is unchanged and no MenDi files were written.
- [x] 3.2 Inspect the final diff against the pre-existing Delivery Run sequence edits, preserving their exact hunks; verify only this Change's intended source, tests and OpenSpec files are attributed to this Apply.

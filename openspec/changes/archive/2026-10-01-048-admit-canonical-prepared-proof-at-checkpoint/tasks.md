## 1. Candidate Run chain

- [x] 1.1 Reuse the existing three-file Run parsing and address validation for index blobs, then add a bounded reader for the exact proof owner Change Run group in the pending index; verify complete records, partial/conflicted paths, duplicate groups and index-only identity with focused tests.
- [x] 1.2 Feed candidate-tree records to the existing `resolveRunChain`/Policy path and identify a prepared proof owner with one legal direct successor; verify Owner correction, same-Action continuation, prepared tip, fork, illegal edge and fake verdict fixtures.

## 2. Managed checkpoint admission

- [x] 2.1 Admit only newly added prepared proof whose owner Result has one exact declaration and whose complete legal chain is present in the candidate tree, while preserving terminal behavior and index/worktree/path/bytes/SHA checks; verify the bounded Git fixture accepts both prepared continuation forms and rejects a successor present only in worktree.
- [x] 2.2 Verify missing or duplicate proof declarations, wrong owner identity, byte/hash drift, partial/conflicting candidate records, and no-new-proof/reuse/push paths fail or bypass exactly as specified, with no Run rewrite or index cleanup.

## 3. Acceptance

- [x] 3.1 Run the relevant checkpoint and Run-chain tests, strict OpenSpec validation, and applicable repository checks; retain current Apply evidence and report actual PASS/FAIL and platform limits without treating this Proposal's Explore fixture as implementation acceptance.

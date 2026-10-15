# Prototype plan and test criteria

**Deliverable:** a working, locally testable, IP-contract-first proof of concept that can later be demonstrated alongside the AI IP white paper. Draft planning only; nothing in this file is an assertion that deployed or production-tested code exists.

## Phase 0 — Preserve old InfinityMint

- Work exclusively on branch ai-ip-v0.1.
- Keep legacy InfinityMint contracts and deployment scripts untouched during the first prototype.
- Add new contracts under contracts/aiip and independent test/config scripts.
- Audit legacy Linker, Storage, Authentication and royalty logic for reuse ideas; do not copy old financial arithmetic without rewriting and testing.

## Phase 1 — One brick / no platform mint fee

1. Implement YellowBrick contract initialization and a versioned factory using deterministic minimal proxies.
2. Register one example creative work and mint its contract on a local EVM.
3. Assert distinct contract address, content commitment, controller/creator distinction, and metadata.
4. Assert no Road/platform markup; only underlying chain gas is paid. Validate repeat mint/replay and duplicate-ID policy.
5. Simulate direct on-chain calls and module authorization failures.

## Phase 2 — Buildings and relationships

1. Deploy at least three standalone Yellow Bricks: recording, artwork, photograph.
2. Create an Album Building referencing recording and artwork by typed relationship.
3. Create a Regeneration Building referencing photograph and a permitted collection.
4. Assert reuse of one brick across two buildings without ownership transfer.
5. Verify membership/derivation edges in both directions through emitted events and an indexer.
6. Reject unauthorized relationship licensing claims; building association is not permission.

## Phase 3 — Controlled AI usage / $1 settlement

1. Publish a versioned AI license for a registered source brick.
2. Sign a provider usage event, including batch, source IP ID, model/version, license version, use type and timestamp.
3. Verify inclusion in a Merkle usage commitment.
4. Settle exactly 1.00 units of a 2-decimal test token (or 1_000_000 units in 6-decimal currency, if configured).
5. Demonstrate 80/20 rights-holder payout **in a no-fee or fee-paused scenario**, guaranteeing 0.80 and 0.20.
6. Demonstrate separately the Road microfee variant, where payout splits apply to settlement net of the capped fee.
7. Register a generated child brick and preserve an evidence-bearing source edge.
8. Prevent double-settlement of the same batch; reject unauthorized attestors and invalid license versions.

## Phase 4 — Node operator eligibility + budget cap

1. Register two *test* Road operators, with one mocked verified eligible and one ineligible. Production real-node verification remains unsolved.
2. Set proposed test fee rate and an explicit finite operating-period funding target by governance configuration.
3. Prove eligible operators can claim compensation only for qualified recorded services.
4. Prove ineligible addresses cannot claim Road treasury fees; royalties do not count as infrastructure compensation.
5. Test a fee exactly exhausting remaining cap; further eligible payments pay zero Road fee.
6. Show unspent reserve reducing the next period's required funding amount; no budget counter reset loophole.
7. Prove a proposed fee change must wait for vote approval/timelock; do not implement a single admin unlimited withdrawal.

## Phase 5 — Weighted participation and explorer

1. Build an initial UI to create/view bricks, group them into buildings, display usage proofs, view treasury state, and vote in a mocked governance sandbox.
2. Give every distinct test user baseline voting weight and bounded additional contribution weight.
3. Test that funding many wallets, registering spam bricks, or claiming node addresses does not increase influence under the proposed identity policy.
4. Stress-test governance capture, operator Sybil attacks and malicious proposal amendments.
5. Document privacy and external verification assumptions; do not claim full Sybil resistance until independently evaluated.

## Test outputs and gates

- Reproducible local deployments, transaction/event traces, a small source/output graph and deterministic unit tests.
- A public demo of: create IP brick → assemble building → grant machine-readable license → log attested use → settle royalties → cap utility fee → view provenance.
- Smart contract security review before mainnet and third-party audit before custody of real royalties.
- Legal review before claims about copyright, entitlement, node compensation/tax and financial regulation.

**First executable target:** one deployed brick contract and one structure with an explicit reference. Do not build a speculative token, complex multi-chain infrastructure, or proof-of-personhood system before this vertical slice passes.

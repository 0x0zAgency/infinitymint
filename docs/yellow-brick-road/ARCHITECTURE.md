# Architecture: IP first, structures second

Status: **Draft v0.1**, 2026-10-15. Based on the original InfinityMint object, linker, storage, royalty, and token-bound account experiments.

## Core reversal

Legacy InfinityMint prioritized minting a product or minter that could then create/manage IP. Yellow Brick Road prioritizes **the independently existing work and its rights interface**:

1. IP is represented by a Yellow Brick smart contract with a unique contract address.
2. A Yellow Brick can be used in zero, one, or many structures.
3. Structures (album, collection, catalog, licensed dataset, AI model provenance/“regeneration megabuilding”, output) are contracts that reference bricks/other structures.
4. A structure may itself represent new IP, but inclusion neither transfers ownership nor confers permission automatically.
5. Usage events and settlements preserve traceable references to the underlying IP contracts.

## Physical metaphor ↔ implementation

| 0x🟨 vocabulary | Engineering interpretation |
| --- | --- |
| Brick | An independently deployed IP contract instance, with persistent identity, provenance, metadata, typed rights modules and payment routing |
| Brickworks | Deterministic factory deploying minimal-proxy clones or equivalent inexpensive per-brick contracts; originator pays underlying chain gas |
| Building | A composable structure contract referencing works and/or substructures via typed, evidence-bearing edges |
| Regeneration megabuilding | A structure or graph encompassing datasets, participating AI systems, outputs and derivation relationships, with explicit evidence of declared uses |
| Road | Open registry, standards, relationship/discovery index and settlement interoperability |
| Road node | Independently owned/operated underlying blockchain node plus verified, compensated Road indexing or verification service |
| Road treasury | Budget-capped utility-fee escrow, never a speculative asset or passive yield mechanism |

## Contract boundary sketch

~~~text
Creator/signing wallet
    |
    | pays EVM gas only (no Road mint markup)
    v
YellowBrickFactory --CREATE2 / EIP-1167--> YellowBrick instance
                                              | unique address
                                              | controller / claims / immutable content commitment
                                              +-- Rights / License modules
                                              +-- Provenance edges
                                              +-- Royalty payout policy
                                              +-- Usage batch commitments
                                                     |
                               +---------------------+--------------------+
                               v                                          v
                  YellowBrickStructure                       Road Settlement
                 (album / dataset / AI                           |
                  megabuilding / output)                    creator royalties
                               |                              + capped fee
                      typed member references                     |
                               |                            Road treasury
                         Road graph/indexer                         |
                                                              verified node
                                                              operators only
~~~

### The basic YellowBrick contract

Proposed minimal fields:

- Persistent protocol IP ID: a domain-separated content/claim/issuer commitment; not just an address and not necessarily a bare media hash
- Immutable or appropriately versioned content hash and registration evidence
- Controller address for administration (not automatic legal copyright ownership)
- Metadata and provenance URIs/commitments (can point to access-controlled off-chain material)
- Typed and versioned module references: Rights, License, Provenance, Usage, Settlement
- Payment destination(s), governed by an explicit royalty policy
- Events exposing historical changes, with nonretroactive license/version accounting

Prefer EIP-1167 clones with CREATE2 deterministic addressing, pinned implementation versions, explicit initialization and a safety-reviewed upgrade/migration path. Avoid silently replacing existing brick contract logic; new implementations should use opt-in migrations or versioned modules. A brick contract address is a distinct **economic identity**; IP identity should still survive chain migrations.

Registration records a claim, not a government copyright registration or independent proof of authorship. Counterclaims, revisions and dispute status should be expressible without deleting historical evidence.

### Buildings, collections, and provenance

A Structure stores typed membership relationships:

- CONTAINS: album → track, collection → photo, dataset → source work
- DERIVED_FROM: generated work → cited source object, with evidence of the relationship
- LICENSES: authorized grant tied to party, purpose, scope and effective time
- GENERATED_BY: output → cooperating provider/model/version, with event or audit record
- DISTRIBUTES: release/album → constituent economic beneficiaries under explicit agreements

Members remain independently addressable and reusable. Relationships are versioned, timestamped, and linked to evidence. Cap array writes and favor indexed event logs / pagination for large structures; large graphs belong in off-chain indexes committed to verifiable roots. Prevent cycles in derivation ancestry, although membership arrangements may need more general graph semantics.

### Registration vs operational infrastructure

A creator does **not** need to operate their own blockchain node to register an IP brick. The creator signs and pays underlying network gas for deployment; the Road organization does not need to sponsor the gas. Operators of actual blockchain nodes (plus qualifying Road services) form the compensated operational layer. No Road-specific registration fee, paid account, mining requirement, token lockup, or validator purchase.

Raw content need not be publicly disclosed to register a hash/manifest. The Road should enable creator-selected access controls and durable data availability policies without promising perpetual IPFS persistence for free.

### Licensing / AI accounting

AI access must be conditioned on a versioned, machine-readable permission grant. Separate training, fine-tuning, retrieval, inference, derivative generation, commercial output, and attribution provisions. An IP Object can represent many kinds of rights, including separate recording versus composition rights.

High-volume uses are off-chain signed events, periodically committed in Merkle roots with identifiable provider, model/version, period, license version, event type, works/collection membership and amount. Settlement verifies authenticated claims and inclusion proofs where provided, then allocates assets to rights-holder accounts. Signed provider statements are **attestations, not proofs of model causality**. Uncooperative or opaque AI models cannot be assumed to emit attributable use records.

For generated works, preserve source connections when actually established; never infer a definitive causal training-source graph from model output alone.

## Reuse vs replace from InfinityMint

| Existing implementation | Disposition | Reason |
| --- | --- | --- |
| InfinityMintObject / destinations | REINTERPRET | Proven conceptual basis for a composable IP-centered contract; drop graphics-specific path/color fields from core |
| InfinityMintLinker | ADAPT | Typed/versioned module registry and per-brick attachment; audit authorization, slot semantics and integrity |
| InfinityMintStorage | REDESIGN | Separate immutable commitments, historical versioning, rights assertions; remove unsafe admin rewriting paths |
| Authentication | REPLACE/HARDEN | Least-privilege access, replay-resistant signatures, verified roles; audit reentrancy defenses |
| SplitRoyalty | REPLACE | Legacy is deployment-level, has coarse percentage arithmetic and assumptions unsuitable for per-IP balances |
| Asset/render/mint path system | OPTIONAL | Presentation and minting products become structure extensions, not mandatory foundation |
| InfinityMint React Maker | REUSE IDEAS | Road browser, brick explorer, licenses and provenance graph need new UX |

## Standards and implementation candidates (to be researched/tested)

ERC-1167 minimal proxies; ERC-165 interface discovery; ERC-1271 contract signatures; ERC-20 stablecoins for settlement; EIP-712 typed signed usage/budget messages; Merkle inclusion proofs; OpenZeppelin vetted access-control and reentrancy modules. Assess ERC-6551 token-bound accounts as an optional module rather than forcing a token on every brick. This is not a proposal for a new L1 blockchain.

Security constraints: initialization access, module upgrade consent, factory salts, replay domain separation, duplicate usage batches, reentrancy, integer rounding, accounting solvency, withheld payments, governance permissions and compromised operator credentials.

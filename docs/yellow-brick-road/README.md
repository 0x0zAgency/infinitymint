# 0x🟨 Road — The Yellow Brick Road of 0x0z

**An IP-first protocol built on InfinityMint.**

> Every Yellow Brick is an independently addressable IP contract. Every building is a composition of bricks. The Road connects them through provenance, licensing, verified usage, accounting, and royalties.

**Protocol principles:** individual IP first; albums/collections/datasets/products second; pay only underlying blockchain gas to register; no platform mint fee; economic activity funds public-utility operations; only eligible blockchain-node operators may receive Road infrastructure fees; approved budgets strictly cap collection; all users may vote, with bounded, earned weights.

This is a design and prototype effort. The existing InfinityMint platform remains intact and is not yet replaced or deployed by these specifications.

## Start here

- [Architecture and relationship graph](ARCHITECTURE.md)
- [Fee, node, and governance constitution](ECONOMICS_GOVERNANCE.md)
- [Decisions and unresolved questions](DECISIONS.md)
- [Prototype milestones and acceptance tests](PROTOTYPE_PLAN.md)
- [Draft Solidity interfaces](../../contracts/aiip/interfaces/)

## The brick / building / road model

~~~mermaid
flowchart TB
    A["🟨 Song IP contract"] --> AL["🏢 Album structure contract"]
    B["🟨 Cover art IP contract"] --> AL
    C["🟨 Photograph IP contract"] --> DS["🏙 AI Dataset / Regeneration structure"]
    A --> DS
    AL --> ROAD["🟨 Road registry, relationship graph & discovery"]
    DS --> ROAD
    ROAD --> U["License and verifiable usage settlement"]
    U --> H["Rights-holder payouts"]
    U --> F["Budget-capped Road microfee"]
    F --> N["Verified eligible node operators"]
~~~

Building membership does not transfer copyright or grant a license. Contracts record identities, declared rights, verifiable proofs, and economic events; they do not adjudicate copyright claims or establish causal model influence by themselves.

**Identity is distinct from commerce.** Off-chain creation/drafting and metadata access can be free. On-chain activation is paid for by the IP originator as *chain gas only*. The Road's own economic-transaction fee remains separate and is not charged for registration.

**Scope note:** This describes proposed architecture. The interfaces under contracts/aiip are unimplemented and have not been security audited.

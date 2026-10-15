# 0x🟨 Road decision log

Snapshot: 2026-10-15. This distinguishes explicit product direction from still-open design decisions; it is not a governance ratification or legal conclusion.

## Confirmed direction from project discussion

- **IP before products.** Create and identify each independently addressable work first. Albums, collections, catalogs, model datasets, and generated results are later compositions.
- **One Brick = one IP contract.** Each Yellow Brick has its own contract address, and can simultaneously belong to multiple structures.
- **Buildings are contracts.** Examples include an Album Building or an AI “Regeneration Megabuilding.” The Road is the network of identity, relationships, permissions and accounting.
- **No Road registration fee.** An originator choosing on-chain activation pays existing blockchain gas; Road registration adds no markup. Ordinary users do not need to operate nodes.
- **Real node operation required to collect infrastructure fees.** Compensation reserved for independently verifiable blockchain-node operators who also deliver approved Road services; IP royalties are separate.
- **Usage-funded, budget-capped microfees.** The Road is a utility, not a speculative financial vehicle. Governance can revise authorized fees and budgets prospectively as needs change.
- **All users vote, with weighting.** Participation is universal; votes are weighted by legitimate contributions, not just wallets, IP counts, wealth, transaction volume or node count.

## Implementation proposals, not final approvals

- Use deterministic EIP-1167 clones deployed by a CREATE2 factory for unique low-gas contract addresses.
- Preserve a chain-independent IP identifier alongside each brick address.
- Emit evidence-bearing relationship events; build a scalable off-chain graph index.
- Use signed provider usage logs, Merkle roots, stablecoin settlement, per-IP split policies and pull-claim withdrawals.
- Apply fee collection only to commercial Road settlement/licensing flows, not content reading or free drafting.
- Avoid a protocol native token; use transparent stable-value accounting.
- Use baseline verified-person participation + capped contribution weight with privacy-respecting Sybil resistance.
- Keep high-volume usage off-chain, anchored to a single chain for the initial demo.
- Require node operators to supply measurable Road services rather than merely running idle nodes.

## Questions the prototype must answer

1. Exactly how is independent IP identity canonicalized for different media and right types?
2. How does the network determine whether a node is actually owned/operated, not proxied or rented by an unverified party?
3. Who qualifies as a distinct user without compulsory publication of personal identifying information?
4. Which events trigger a fee, and what is the minimum viable fee/cap period configuration?
5. How do multiple collecting societies, publishers, coauthors and disputed rights claims coexist?
6. How are AI usage records verified, challenged and audited when model providers control the logs?
7. What rights are inherited (or not) when structures nest and generated works reuse prior works?
8. How can network governance be distributed without giving insiders or high-volume operators control?

## Explicit non-goals for the first prototype

- Launching a new blockchain, selling a Road token, rewarding speculative holding
- Claiming on-chain registration legally proves copyright ownership
- Universal attribution of output to every item in a black-box training corpus
- Running 2,000 physical nodes before demonstrating one usable service
- Cross-chain fee caps or decentralized voting before defining trustworthy accounting and identity

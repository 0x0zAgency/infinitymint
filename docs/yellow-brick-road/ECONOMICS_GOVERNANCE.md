# The Road's public-utility economic and governance constitution

Status: **design principles agreed; parameters and verification mechanisms proposed, not ratified.**

## Economic commitments

1. **IP identity is not a paywall.** Free off-chain drafting/discovery. On-chain brick deployment requires underlying blockchain gas paid by the IP originator. The Road charges **no** creation/mint/platform registration markup.
2. **Economic use pays for the utility.** A small, transparently disclosed Road microfee applies to eligible commercial licensing/settlement transactions, not every read or metadata lookup. The payer is shown chain gas separately.
3. **No investment-style returns.** No protocol investment token, staking yield, passive node rewards or fees to holders solely because they own IP or purchased an asset. Royalties for licensed IP remain distinct from operational node compensation.
4. **Only qualifying blockchain-node operators can collect/disburse Road infrastructure fees as compensation.** A beneficiary must own/operate a real underlying-chain node **and** supply an approved, measurable Road service. The organizing entity must itself meet this rule to receive operational fees.
5. **Fees stop at the budget cap.** Collect no more in protocol microfees than the community-authorized funding target for that period. Fees drop to zero after the cap. Chain gas remains separate and cannot be capped by this protocol.
6. **Governed costs, not unlimited revenue.** Verified invoices/work, transparent budgets, reserve ceilings and regular audits; unspent treasury assets count against subsequent funding needs.

## Fee algorithm

Single-chain pilot; payment asset restricted to an audited, configured ERC-20 test token for v0.1. Use integer units and approved basis points.

~~~text
authorized_target =
    approved_period_operating_budget
  + approved_reserve_replenishment
  - available_unspent_unrestricted_treasury_balance
  - nonfee_funding_applied_to_same_budget

remaining = max(0, authorized_target - fees_collected_for_period)
quoted_fee = floor(eligible_transaction_amount * approved_fee_bps / 10_000)
actual_fee = min(quoted_fee, remaining)

if remaining == 0, actual_fee = 0
~~~

An approved budget/cap change is prospective, timelocked, published, and requires a qualifying vote. Do not reset collection counters to evade caps; period rollover explicitly carries existing reserves. Limit eligible fee collections and avoid collecting fees on zero-value internal bookkeeping. Settlement may proceed even when the Road fee is zero.

**Example only:** a $100 licensed use with a hypothetical 0.5% Road fee yields $99.50 to the rights-holder settlement graph and $0.50 in utility fees, unless remaining budget capacity is lower. Exact shares are license-specific. 0.5% is not an approved protocol rate.

**Operational caveat:** gas is paid to the underlying chain's network operators and is not controlled by the Road's microfee cap. Direct chain transactions or off-protocol settlements cannot reliably be charged a Road fee unless parties explicitly use the protocol.

## Verified node eligibility

Eligibility for **receiving operational Road utility fees**, not for creating IP:

- Demonstrable control of and operation of a qualifying full/blockchain node on an approved network
- Active provision of a useful Road service (indexing, verified API serving, data availability, proof verification, settlement observation)
- Independent challenge/testing, quality metrics, uptime reports and a public operator identifier
- No compensation purely for submitting an address or operating idle hardware
- Public payout records and appeals/review mechanisms; remove eligibility if conditions no longer hold

**Known technical limitation:** Solidity cannot independently prove that a beneficiary truly owns and continuously operates a physical blockchain node. Full-node eligibility needs external attestation, cryptographic challenges where possible, audit and revocation, with documented trust assumptions. Avoid making false claims of fully trustless node ownership proofs. Eligibility must not be conflated with validator staking.

The capped treasury may hold unspent funds, but *fee distributions to operational recipients* are permitted only to qualifying operators for demonstrated services. If no operators are eligible, governance may pause fee collection and initiate a transparent recovery process; it cannot bypass eligibility to distribute to passive recipients.

## All users vote. Weight is earned, bounded and non-purchasable.

Every **verified unique participating user**, including a consumer with no owned IP and no operated node, receives a baseline governance voice. A wallet is an account, not inherently a unique person; privacy-preserving identity and Sybil resistance are required.

Potential bounded weight dimensions:

| Participation | Examples of verifiable contribution | Abuse controls |
| --- | --- | --- |
| IP originator | Sustained, verified rights publication and work maintenance | No weight for spam-minting or work-count alone |
| Licensed user | Authenticated good-faith participation and history | Transaction size, wealth and self-dealing cannot buy weight |
| Road operator | Measured and independently challenged uptime/service quality | Cap related nodes and operator identities |
| Contributor | Accepted open code, governance reviews, audits, documentation | Peer validation and conflict disclosure |
| General user | Universal baseline and proven usage/community participation | Unique-person proofs without blanket public ID exposure |

**No fixed weight percentages have yet been chosen.** Proposals should use bounded, saturation/logarithmic contributions with per-user caps, decay and auditability. Avoid token-weighted voting, wallet-count voting, spend-weighted influence, and one vote per node. Ownership of many bricks/buildings never automatically conveys votes over others' IP.

### Governance authority and limitations

Governance may: approve operating budgets, fee ceilings and period caps, qualify and audit node operators, maintain reference standards and roadmap, and change prospectively configurable *network* settings.

Governance may **not**: confiscate IP, impose retroactive license changes, override a valid rights-holder payout agreement, fabricate usage evidence, change registered source hashes in-place, or transfer someone else's copyright.

Suggested process, subject to the inaugural governance vote:

1. Public proposal, budget forecast, operator disclosures, diff and timelock.
2. Sybil-resistant snapshot of voters/participation weights.
3. Voting with published quorum, higher thresholds for treasury/constitutional changes and conflict checks.
4. Timelocked on-chain execution; emergency pause can stop fees/services temporarily but cannot seize rights-holder balances.
5. Periodic full treasury accounting; audited rollover and a path to challenge operators and votes.

Unresolved: unique-user verification, the actual weight formula, quorum/thresholds, fee basis-point limits, max budget cap changes, service acceptance proofs and organization/legal structure.

## Nonfinancial positioning

The Road is a decentralized IP identification, rights interoperability and accounting utility. It must not market brick ownership or node operation as a speculative financial opportunity. Node service compensation is payment for measurable infrastructure work. IP royalties are consideration for actual licensed use, not a Road investment return.

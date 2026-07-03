# Payment Integrity Protocols

**Created:** 2026-07-04
**Related:** Feature 67, PAYMENT_TRANSACTION_SAFETY.md

## The 5 Rules

1. **Idempotency Keys** - Same request = same result
2. **Two-Phase Commit** - Payment + DB updated atomically
3. **Webhooks** - Ensure consistency on timeouts
4. **Daily Reconciliation** - Fix stuck payments
5. **Audit Trail** - Track every attempt

## Quick Reference

```typescript
// Generate idempotency key
const key = hash(`${userId}-${plan}-${hour}`);

// Two-phase commit
1. Create PaymentIntent (PENDING)
2. Charge Stripe + Update DB (transaction)
3. On failure: Refund + Mark ROLLED_BACK
```

See ARCHITECTURE_ENHANCEMENT_ANALYSIS.md Part 4 for full implementation.

# Payment Transaction Safety

**Created:** 2026-07-04  
**Status:** Active Implementation  
**Related:** Feature 67, FOUNDRIE_V17.0.0  
**Full Analysis:** `ARCHITECTURE_ENHANCEMENT_ANALYSIS.md` Part 4

---

## Quick Reference

### The Golden Rules

1. **Idempotency:** Same request = same result (no double-charges)
2. **Two-Phase Commit:** Payment + Database updated atomically
3. **Webhooks:** Ensure consistency even if request times out
4. **Daily Reconciliation:** Find and fix stuck transactions
5. **Audit Trail:** Track every payment attempt

---

## Idempotency Key Generation

```typescript
// Client-side (hourly window)
const hour = Math.floor(Date.now() / (1000 * 60 * 60));
const key = `${userId}-${plan}-${hour}`;

// Server-side (deterministic hash)
const key = createHash("sha256")
  .update(`subscribe-${userId}-${plan}`)
  .digest("hex");
```

**Why hourly window?** Prevents duplicate subscriptions within same hour but allows retry if first attempt truly failed.

---

## Two-Phase Commit Pattern

```
PHASE 1: PREPARE
├─ Create PaymentIntent (status: PENDING)
├─ Validate preconditions
└─ Generate idempotency key

PHASE 2: COMMIT
├─ Charge Stripe (with idempotency key)
├─ Update database (in transaction)
└─ Mark intent COMPLETED

PHASE 3: ROLLBACK (if Phase 2 fails)
├─ Refund Stripe (if charged)
├─ Mark intent ROLLED_BACK
└─ Alert admin
```

---

## Stripe Webhook Verification

```typescript
// ALWAYS verify signature
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET // NEVER expose this
);

// Update payment intent (idempotent)
if (event.type === "charge.succeeded") {
  await db.paymentIntent.update({...});
  await db.user.update({...}); // Ensure upgraded
}
```

**Why webhooks?** User's request might timeout, but webhook ensures database eventually consistent.

---

## Common Payment Failure Scenarios

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| Double-click | Idempotency key | Second request returns "already_processed" |
| Power loss | Webhook | Database updated via webhook |
| Network timeout | Webhook | Webhook completes transaction |
| Stripe succeeds, DB fails | Transaction rollback | Auto-refund + alert |
| Stuck in PROCESSING | Daily reconciliation | Check Stripe, fix DB |

---

## Daily Reconciliation

```typescript
// Find payments stuck >1 hour
const stuck = await db.paymentIntent.findMany({
  where: {
    status: "PROCESSING",
    createdAt: { lt: oneHourAgo },
  },
});

for (const payment of stuck) {
  // Check actual Stripe status
  const charge = await stripe.charges.retrieve(payment.stripeChargeId);
  
  if (charge.status === "succeeded") {
    // Stripe succeeded but DB not updated → fix it
    await db.$transaction([...]);
  } else {
    // Stripe failed → mark as failed
    await db.paymentIntent.update({ status: "FAILED" });
  }
}
```

**Runs:** 2 AM daily  
**Guarantee:** 100% of stuck payments reconciled within 24 hours

---

## Frontend Double-Click Prevention

```typescript
const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");

async function handleUpgrade() {
  if (status !== "idle") return; // ✅ Prevent double-click
  
  setStatus("processing");
  
  try {
    const response = await fetch("/api/payments/subscribe", {
      method: "POST",
      body: JSON.stringify({ plan: "PRO" }),
    });
    
    const data = await response.json();
    
    if (data.already_processed) {
      toast.success("Already upgraded!");
    } else {
      toast.success("Upgraded to Pro!");
    }
    
    setStatus("success");
  } catch (error) {
    setStatus("idle"); // Allow retry on error
    toast.error("Payment failed. Please try again.");
  }
}

return (
  <button
    onClick={handleUpgrade}
    disabled={status !== "idle"} // ✅ Disabled while processing
  >
    {status === "processing" ? "Processing..." : "Upgrade to Pro"}
  </button>
);
```

---

## Rate Limiting

```typescript
// Max 3 payment attempts per minute per user
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
});

const { success } = await ratelimit.limit(`payment:${userId}`);
if (!success) {
  throw new TooManyRequestsError("Too many payment attempts");
}
```

---

## Audit Trail Schema

```prisma
model PaymentIntent {
  id               String        @id @default(cuid())
  transactionId    String        @unique  // For correlation
  idempotencyKey   String        @unique  // Prevent duplicates
  userId           String
  amount           Int           // In cents
  currency         String        @default("usd")
  status           PaymentStatus
  stripeChargeId   String?       // Stripe reference
  errorMessage     String?       // If failed, why?
  refundInitiated  Boolean       @default(false)
  metadata         Json?         // Additional context
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  
  @@index([userId, createdAt])
  @@index([status])
}

enum PaymentStatus {
  PENDING       // Intent created
  PROCESSING    // Charging Stripe
  COMPLETED     // Success
  FAILED        // Charge failed
  ROLLED_BACK   // Refunded due to DB error
  DISPUTED      // User disputed charge
}
```

---

## Testing Strategy

```typescript
// Test 1: Double-click
test("double-click only charges once", async () => {
  await Promise.all([
    fetch("/api/payments/subscribe", { method: "POST" }),
    fetch("/api/payments/subscribe", { method: "POST" }),
  ]);
  
  const intents = await db.paymentIntent.findMany({ where: { userId } });
  expect(intents).toHaveLength(1); // Only one created
});

// Test 2: Rollback
test("refunds if DB update fails", async () => {
  vi.mocked(db.user.update).mockRejectedValue(new Error("DB down"));
  
  await expect(upgradeUser(userId)).rejects.toThrow();
  
  const refunds = await stripe.refunds.list();
  expect(refunds.data).toHaveLength(1); // Refund created
});

// Test 3: Webhook recovery
test("webhook fixes stuck payment", async () => {
  // Create stuck payment
  await db.paymentIntent.create({ status: "PROCESSING" });
  
  // Simulate webhook
  await webhookHandler({
    type: "charge.succeeded",
    data: { object: charge },
  });
  
  const intent = await db.paymentIntent.findUnique({...});
  expect(intent.status).toBe("COMPLETED");
});
```

---

## Implementation Checklist

- [ ] `PaymentIntent` model in Prisma
- [ ] Two-phase commit wrapper
- [ ] Stripe webhook handler with signature verification
- [ ] Idempotency key generation
- [ ] Frontend double-click prevention
- [ ] Rate limiting on payment endpoint
- [ ] Daily reconciliation task
- [ ] Audit dashboard for payment investigations

---

**See `ARCHITECTURE_ENHANCEMENT_ANALYSIS.md` Part 4 and `docs/PAYMENT_INTEGRITY_PROTOCOLS.md` for operational procedures.**

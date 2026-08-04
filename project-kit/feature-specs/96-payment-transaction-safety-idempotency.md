# Feature 76: Payment Transaction Safety & Idempotency

**Status:** Not Started  
**Priority:** P0 (Blocking Monetization)  
**Dependencies:** None  
**Assigned To:** AI Agent  
**Estimated Effort:** 5 days

---

## Problem Statement

### Current Risks

1. **No Idempotency:** Double-button-press causes double charge
2. **No Rollback:** Payment succeeds but database update fails = money taken, no upgrade
3. **No Audit Trail:** Cannot investigate payment disputes
4. **Power Failure Risk:** User loses power mid-payment → transaction state unknown
5. **Network Timeout:** Request times out but payment may have succeeded

### Impact

- Legal liability from double-charging users
- Customer trust loss from failed upgrades after payment
- Cannot prove payment status during disputes
- Revenue loss from unreconciled transactions

---

## Solution Overview

Implement bank-grade payment safety:

1. **Idempotency Keys** - Prevent duplicate charges
2. **Two-Phase Commit** - Coordinate payment + database atomically
3. **Stripe Webhooks** - Handle async payment confirmation
4. **Daily Reconciliation** - Find and fix stuck transactions
5. **Rate Limiting** - Prevent rapid-fire payment attempts

---

## Technical Design

### 1. Payment Intent Model

```prisma
// prisma/schema.prisma (ADD THIS)
model PaymentIntent {
  id               String        @id @default(cuid())
  transactionId    String        @unique
  idempotencyKey   String        @unique
  userId           String
  amount           Int           // Cents
  currency         String        @default("usd")
  status           PaymentStatus
  stripeChargeId   String?
  errorMessage     String?
  refundInitiated  Boolean       @default(false)
  metadata         Json?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
  @@index([status])
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  ROLLED_BACK
  DISPUTED
}
```

### 2. Two-Phase Commit Wrapper

```typescript
// lib/payments/two-phase-commit.ts
export async function executePaymentTransaction(
  userId: string,
  amount: number,
  operation: () => Promise<void>
): Promise<{ success: boolean; transactionId: string }> {
  const txId = generateTransactionId();
  
  // PHASE 1: PREPARE
  const intent = await db.paymentIntent.create({
    data: {
      transactionId: txId,
      userId,
      amount,
      status: "PENDING",
    },
  });
  
  let charge: Stripe.Charge | null = null;
  
  try {
    // PHASE 2: COMMIT
    // Step 1: Charge Stripe
    charge = await stripe.charges.create(
      {
        amount,
        currency: "usd",
        customer: userId,
        metadata: { transactionId: txId },
      },
      { idempotencyKey: txId }
    );
    
    // Step 2: Execute database operation
    await db.$transaction(async (tx) => {
      await operation(); // User's custom logic
      
      await tx.paymentIntent.update({
        where: { id: intent.id },
        data: { 
          status: "COMPLETED",
          stripeChargeId: charge.id 
        },
      });
    });
    
    return { success: true, transactionId: txId };
    
  } catch (error) {
    // PHASE 3: ROLLBACK
    if (charge) {
      // Payment succeeded but DB failed → refund
      await stripe.refunds.create({
        charge: charge.id,
        reason: "database_failure",
      });
    }
    
    await db.paymentIntent.update({
      where: { id: intent.id },
      data: { 
        status: "ROLLED_BACK",
        errorMessage: error.message,
        refundInitiated: !!charge,
      },
    });
    
    throw error;
  }
}
```

### 3. Idempotent Subscribe Endpoint

```typescript
// app/api/payments/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { executePaymentTransaction } from "@/lib/payments/two-phase-commit";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  const { plan } = await req.json();
  
  // Generate idempotency key
  const hour = Math.floor(Date.now() / (1000 * 60 * 60));
  const idempotencyKey = createHash("sha256")
    .update(`subscribe-${user.id}-${plan}-${hour}`)
    .digest("hex");
  
  // Check if already processed
  const existing = await db.paymentIntent.findUnique({
    where: { idempotencyKey },
  });
  
  if (existing?.status === "COMPLETED") {
    return NextResponse.json({ 
      success: true, 
      already_processed: true 
    });
  }
  
  // Execute two-phase commit
  const result = await executePaymentTransaction(
    user.id,
    2000, // $20
    async () => {
      await db.user.update({
        where: { id: user.id },
        data: { plan: "PRO" },
      });
    }
  );
  
  return NextResponse.json(result);
}
```

### 4. Stripe Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");
  
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  
  if (event.type === "charge.succeeded") {
    const charge = event.data.object as Stripe.Charge;
    const txId = charge.metadata.transactionId;
    
    // Update payment intent
    await db.paymentIntent.update({
      where: { transactionId: txId },
      data: { 
        status: "COMPLETED",
        stripeChargeId: charge.id 
      },
    });
    
    // Ensure user is upgraded (idempotent)
    await db.user.update({
      where: { id: charge.customer as string },
      data: { plan: "PRO" },
    });
  }
  
  if (event.type === "charge.failed") {
    const charge = event.data.object as Stripe.Charge;
    const txId = charge.metadata.transactionId;
    
    await db.paymentIntent.update({
      where: { transactionId: txId },
      data: { status: "FAILED" },
    });
  }
  
  return NextResponse.json({ received: true });
}
```

### 5. Daily Reconciliation Job

```typescript
// trigger/tasks/reconcile-payments.ts
export const reconcilePayments = schedules.task({
  id: "reconcile-payments",
  cron: "0 2 * * *", // 2 AM daily
  run: async () => {
    // Find stuck payments (>1 hour old)
    const stuck = await db.paymentIntent.findMany({
      where: {
        status: "PROCESSING",
        createdAt: { lt: new Date(Date.now() - 3600_000) },
      },
    });
    
    for (const payment of stuck) {
      try {
        const charge = await stripe.charges.retrieve(payment.stripeChargeId);
        
        if (charge.status === "succeeded") {
          // Payment succeeded, fix database
          await db.$transaction([
            db.paymentIntent.update({
              where: { id: payment.id },
              data: { status: "COMPLETED" },
            }),
            db.user.update({
              where: { id: payment.userId },
              data: { plan: payment.metadata.plan },
            }),
          ]);
        } else {
          await db.paymentIntent.update({
            where: { id: payment.id },
            data: { status: "FAILED" },
          });
        }
      } catch (error) {
        // Charge not found → never created
        await db.paymentIntent.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
      }
    }
    
    return { reconciledCount: stuck.length };
  },
});
```

### 6. Frontend Double-Click Prevention

```typescript
// components/upgrade-button.tsx
"use client";
import { useState } from "react";

export function UpgradeButton() {
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
  
  async function handleUpgrade() {
    if (status !== "idle") return; // Prevent double-click
    
    setStatus("processing");
    
    try {
      const response = await fetch("/api/payments/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan: "PRO" }),
      });
      
      const data = await response.json();
      
      if (data.already_processed) {
        setStatus("success");
        toast.success("Already upgraded!");
        return;
      }
      
      setStatus("success");
      toast.success("Upgraded to Pro!");
      
    } catch (error) {
      setStatus("idle"); // Allow retry
      toast.error("Payment failed. Please try again.");
    }
  }
  
  return (
    <button
      onClick={handleUpgrade}
      disabled={status !== "idle"}
    >
      {status === "processing" ? "Processing..." : "Upgrade to Pro"}
    </button>
  );
}
```

---

## Acceptance Criteria

- [ ] Double-button-press never causes double charge
- [ ] Payment succeeds but DB fails → automatic Stripe refund
- [ ] Network timeout doesn't lose payment state
- [ ] Webhook ensures eventual consistency
- [ ] Daily reconciliation finds and fixes all stuck payments
- [ ] Rate limit: Max 3 payment attempts per minute per user
- [ ] Audit trail tracks every payment attempt
- [ ] 100% of stuck payments reconciled within 24 hours

---

## Files Owned

### New Files
- `lib/payments/two-phase-commit.ts`
- `app/api/webhooks/stripe/route.ts`
- `trigger/tasks/reconcile-payments.ts`
- `components/upgrade-button.tsx`

### Modified Files
- `prisma/schema.prisma` (add PaymentIntent model)
- `app/api/payments/subscribe/route.ts`

---

## Testing Requirements

- Unit test: Idempotency (same key = same result)
- Integration test: Payment succeeds, DB fails → verify refund
- E2E test: Double-click button → only one charge
- Load test: 1000 concurrent payment attempts

---

## Out of Scope

- ❌ Multiple payment providers (PayPal, MPESA) - Feature 74
- ❌ Subscription management (cancel, upgrade, downgrade) - Feature 75
- ❌ Invoice generation - Feature 76
- ❌ Tax calculation - Feature 77

---

## External Services Setup

### Stripe Webhook Configuration
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://foundrie.ai/api/webhooks/stripe`
3. Select events: `charge.succeeded`, `charge.failed`
4. Copy webhook signing secret to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

---

**END OF SPEC**

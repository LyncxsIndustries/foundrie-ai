// Clerk -> local User sync webhook (Feature 04).
// Clerk owns identity; this endpoint mirrors the subset Foundrie needs into the
// local User table so ownership scoping and plan gates can run without a Clerk
// round-trip. The route is public (see proxy.ts) because Clerk calls it
// unauthenticated, so the Svix signature IS the authentication — verifyWebhook
// rejects any request whose svix-id/svix-timestamp/svix-signature headers do not
// match CLERK_WEBHOOK_SIGNING_SECRET before we touch the database.
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import { db } from "@/lib/db";

/**
 * Pick the user's primary email from the Clerk payload, falling back to the
 * first verified address. Returns null when none is usable so the caller can
 * skip a sync that would violate the `email` NOT NULL / unique constraint.
 */
function primaryEmail(data: {
  email_addresses?: { id: string; email_address: string }[];
  primary_email_address_id?: string | null;
}): string | null {
  const addresses = data.email_addresses ?? [];
  const primary = addresses.find(
    (entry) => entry.id === data.primary_email_address_id,
  );
  return primary?.email_address ?? addresses[0]?.email_address ?? null;
}

/** Compose an optional display name from Clerk first/last name fields. */
function fullName(data: {
  first_name?: string | null;
  last_name?: string | null;
}): string | null {
  const name = [data.first_name, data.last_name]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .trim();
  return name.length > 0 ? name : null;
}

export async function POST(req: NextRequest): Promise<Response> {
  let evt: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    evt = await verifyWebhook(req, {
      signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
    });
  } catch {
    // Invalid or missing Svix signature: reject before any database access.
    return new Response("Invalid webhook signature.", { status: 400 });
  }

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const email = primaryEmail(evt.data);
      if (!email) {
        // No address to satisfy the unique/NOT NULL email column; acknowledge so
        // Clerk does not retry a payload that can never succeed.
        return new Response("Skipped: user has no email address.", {
          status: 200,
        });
      }

      const name = fullName(evt.data);
      await db.user.upsert({
        where: { clerkId: evt.data.id },
        // New users default to FREE/USER via the schema; do not overwrite plan
        // or role here so billing/admin changes are not reverted by a profile
        // edit syncing back through this webhook.
        create: { clerkId: evt.data.id, email, name },
        update: { email, name },
      });
      break;
    }

    case "user.deleted": {
      // Clerk marks hard deletes with an id; ignore events without one.
      if (evt.data.id) {
        // Scoped to clerkId; Project rows cascade via the schema relation.
        await db.user.deleteMany({ where: { clerkId: evt.data.id } });
      }
      break;
    }

    default:
      // Other Clerk events are not consumed; acknowledge to stop retries.
      break;
  }

  return new Response("Webhook processed.", { status: 200 });
}

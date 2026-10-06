import type Stripe from "stripe";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { stripe } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const exists = await db.marketplaceWebhookEvent.findUnique({ where: { eventId: event.id } });
  if (exists) return NextResponse.json({ received: true, duplicate: true });

  await db.$transaction(async (tx) => {
    await tx.marketplaceWebhookEvent.create({
      data: {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        payloadHash: createHash("sha256").update(body).digest("hex"),
      },
    });

    if (event.type === "checkout.session.completed") {
      const checkout = event.data.object;
      const purchaseId = checkout.metadata?.purchaseId;
      if (purchaseId) {
        const purchase = await tx.templatePurchase.findUnique({ where: { id: purchaseId } });
        if (purchase && purchase.status !== "PAID") {
          await tx.templatePurchase.update({
            where: { id: purchaseId },
            data: {
              status: "PAID",
              paymentIntentId:
                typeof checkout.payment_intent === "string" ? checkout.payment_intent : undefined,
              paidAt: new Date(),
            },
          });
          await tx.marketplaceTemplate.update({
            where: { id: purchase.templateId },
            data: { salesCount: { increment: 1 } },
          });
        }
      }
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const paymentIntentId =
        typeof charge.payment_intent === "string" ? charge.payment_intent : undefined;
      if (paymentIntentId) {
        await tx.templatePurchase.updateMany({
          where: { paymentIntentId, status: "PAID" },
          data: { status: "REFUNDED", refundedAt: new Date() },
        });
      }
    }
  });

  return NextResponse.json({ received: true });
}

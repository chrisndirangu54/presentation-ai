import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { stripe } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId } = (await request.json()) as { templateId?: string };
  if (!templateId) return NextResponse.json({ error: "templateId is required" }, { status: 400 });

  const template = await db.marketplaceTemplate.findUnique({ where: { id: templateId } });
  if (!template || template.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Template is unavailable" }, { status: 404 });
  }

  if (template.creatorId === session.user.id) {
    return NextResponse.json({ error: "Creators already own their templates" }, { status: 400 });
  }

  const existing = await db.templatePurchase.findFirst({
    where: { templateId, buyerId: session.user.id, status: "PAID" },
  });
  if (existing) return NextResponse.json({ purchaseId: existing.id, alreadyOwned: true });

  if (template.isFree || template.priceCents === 0) {
    const purchase = await db.templatePurchase.create({
      data: {
        templateId,
        buyerId: session.user.id,
        status: "PAID",
        amountCents: 0,
        currency: template.currency,
        license: template.license,
        paidAt: new Date(),
      },
    });
    await db.marketplaceTemplate.update({
      where: { id: template.id },
      data: { salesCount: { increment: 1 } },
    });
    return NextResponse.json({ purchaseId: purchase.id, free: true });
  }

  const purchase = await db.templatePurchase.create({
    data: {
      templateId,
      buyerId: session.user.id,
      amountCents: template.priceCents,
      currency: template.currency,
      license: template.license,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
  const checkout = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email ?? undefined,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: template.currency.toLowerCase(),
        unit_amount: template.priceCents,
        product_data: { name: template.name, description: template.description ?? undefined },
      },
    }],
    success_url: `${baseUrl}/marketplace?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/marketplace?purchase=cancelled`,
    metadata: {
      purchaseId: purchase.id,
      templateId: template.id,
      buyerId: session.user.id,
    },
  });

  await db.templatePurchase.update({
    where: { id: purchase.id },
    data: { checkoutSessionId: checkout.id, providerRef: checkout.id },
  });

  return NextResponse.json({ purchaseId: purchase.id, checkoutUrl: checkout.url });
}

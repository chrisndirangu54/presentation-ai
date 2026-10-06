import Stripe from "stripe";

let client: Stripe | undefined;

export function stripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not configured");
  client ??= new Stripe(secret);
  return client;
}

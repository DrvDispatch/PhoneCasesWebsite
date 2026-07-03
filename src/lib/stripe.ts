import Stripe from "stripe";
import { env, isStripeLive } from "./env";

let client: Stripe | null = null;

/**
 * Returns a configured Stripe client, or throws if keys are still placeholders.
 * Callers should guard with `isStripeLive()` to render a friendly message.
 */
export function getStripe(): Stripe {
  if (!isStripeLive()) {
    throw new Error("Stripe is not configured — set a real STRIPE_SECRET_KEY.");
  }
  if (!client) {
    client = new Stripe(env.stripeSecretKey, {
      // Pin apiVersion via the account default; typedefs accept the SDK default.
      typescript: true,
      appInfo: { name: "GlobeCase", version: "1.0.0" },
    });
  }
  return client;
}

export { isStripeLive };

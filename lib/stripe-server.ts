import Stripe from "stripe";

// Avoid throwing at import time when STRIPE_SECRET_KEY is not set (e.g., QA/mock mode)
const secretKey = process.env.STRIPE_SECRET_KEY;

// Export a safe placeholder when key is missing; actual method calls will throw a clear error
export const stripeApi: any = secretKey
  ? new Stripe(secretKey)
  : new Proxy(
      {},
      {
        get() {
          throw new Error(
            "Stripe is not configured (missing STRIPE_SECRET_KEY). This action requires Stripe to be set up."
          );
        },
      }
    );

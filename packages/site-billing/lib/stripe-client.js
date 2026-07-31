const Stripe = require("stripe");

let stripeSingleton = null;

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      apiVersion: "2024-06-20",
    });
  }
  return stripeSingleton;
}

function resetStripeForTests() {
  stripeSingleton = null;
}

module.exports = { getStripe, resetStripeForTests };

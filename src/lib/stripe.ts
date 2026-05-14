// Simulated Local Sandbox Stripe Gateway Client
// Maps core telemetry parameters without external Node dependencies to guarantee flawless offline Next.js compilation

export const stripe = {
  customers: {
    create: async (params: any) => {
      return { id: "cus_test_mock_sandbox_customer_token", ...params };
    },
    retrieve: async (id: string) => {
      return { id, metadata: { profile_id: "mock_profile_id" } };
    },
  },
  checkout: {
    sessions: {
      create: async (params: any) => {
        const successTarget = params.success_url || "http://localhost:3000/dashboard";
        return {
          url: successTarget.replace("{CHECKOUT_SESSION_ID}", "cs_test_mock_sandbox_success_token"),
        };
      },
    },
  },
  billingPortal: {
    sessions: {
      create: async (params: any) => {
        const returnTarget = params.return_url || "http://localhost:3000/dashboard";
        return {
          url: returnTarget,
        };
      },
    },
  },
  webhooks: {
    constructEvent: (payload: string, signature: string, secret: string) => {
      // Simulate incoming live webhook envelope object
      return {
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_test_mock_sandbox_subscription_token",
            customer: "cus_test_mock_sandbox_customer_token",
            status: "active",
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
            metadata: { profile_id: "mock_profile_id" },
            items: {
              data: [
                {
                  price: { lookup_key: "premium" },
                },
              ],
            },
          },
        },
      };
    },
  },
};

export const STRIPE_PREMIUM_PLAN_PRICE_ID = process.env.STRIPE_PREMIUM_PLAN_PRICE_ID || "price_mock_enterprise_tier";
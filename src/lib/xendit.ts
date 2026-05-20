// Simulated Local Sandbox Xendit Gateway Client
// Maps core telemetry parameters without external Node dependencies to guarantee flawless offline Next.js compilation

export const xendit = {
  customers: {
    create: async (params: Record<string, unknown>) => {
      return { id: "cus_test_mock_sandbox_xendit_customer", ...params };
    },
    retrieve: async (id: string) => {
      return { id, metadata: { profile_id: "mock_profile_id" } };
    },
  },
  invoice: {
    create: async (params: Record<string, unknown>) => {
      const successTarget = (params.success_redirect_url as string) || "http://localhost:3000/dashboard";
      return {
        id: "inv_test_mock_sandbox_invoice",
        invoice_url: successTarget.replace("{CHECKOUT_SESSION_ID}", "cs_test_mock_sandbox_success_token"),
      };
    },
  },
  recurring: {
    createPlan: async (params: Record<string, unknown>) => {
      const returnTarget = (params.success_return_url as string) || "http://localhost:3000/dashboard";
      return {
        id: "rp_test_mock_sandbox_plan",
        actions: [
          { url: returnTarget }
        ]
      };
    },
  },
  webhooks: {
    constructEvent: (_payload: string, _signature: string, _secret: string) => {
      // Simulate incoming live Xendit webhook envelope object
      return {
        event: "invoice.paid",
        data: {
          id: "inv_test_mock_sandbox_invoice",
          customer_id: "cus_test_mock_sandbox_xendit_customer",
          status: "PAID",
          items: [
            { name: "Shop Dashboard Pro" }
          ],
        },
      };
    },
  },
};

export const XENDIT_PREMIUM_PLAN_PRICE_ID = process.env.XENDIT_PREMIUM_PLAN_PRICE_ID || "price_mock_enterprise_tier";
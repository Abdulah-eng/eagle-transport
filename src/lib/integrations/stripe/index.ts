import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecret 
  ? new Stripe(stripeSecret, {
      apiVersion: "2024-06-20" as any, // Use the latest API version or specify the one you need
      typescript: true,
    })
  : null;

export const stripeService = {
  async createCustomer(email: string, name: string): Promise<string | null> {
    if (!stripe) {
      console.log(`[Stripe Mock] Would create customer: ${email}`);
      return "cus_mock_" + Date.now();
    }
    
    try {
      const customer = await stripe.customers.create({ email, name });
      return customer.id;
    } catch (error) {
      console.error("[Stripe] Failed to create customer", error);
      return null;
    }
  },

  async createSubscription(customerId: string, priceId: string): Promise<string | null> {
    if (!stripe || customerId.startsWith("cus_mock_")) {
      console.log(`[Stripe Mock] Would create subscription for ${customerId} with price ${priceId}`);
      return "sub_mock_" + Date.now();
    }
    
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });
      return subscription.id;
    } catch (error) {
      console.error("[Stripe] Failed to create subscription", error);
      return null;
    }
  },
  
  async createPaymentIntent(amount: number, metadata: Record<string, string>): Promise<Stripe.PaymentIntent | null> {
    if (!stripe) {
      console.log(`[Stripe Mock] Would create PaymentIntent for ${(amount / 100).toFixed(2)} USD`);
      return { 
        id: "pi_mock_" + Date.now(), 
        client_secret: "mock_secret", 
        amount, 
        status: "requires_payment_method" 
      } as unknown as Stripe.PaymentIntent;
    }
    
    try {
      return await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
    } catch (error) {
      console.error("[Stripe] Failed to create payment intent", error);
      return null;
    }
  }
};

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface CheckoutItem {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
  currency?: string;
}

export interface CreateCheckoutSessionRequest {
  items: CheckoutItem[];
  success_url: string;
  cancel_url: string;
  customer_email?: string;
  client_reference_id?: string;
  metadata?: Record<string, string>;
  mode?: "payment" | "subscription";
  subscription_data?: any;
}

export interface CheckoutSessionResponse {
  session_id: string;
  url: string;
  publishable_key: string;
}

export interface SubscriptionCreateRequest {
  price_id: string;
  customer_email: string;
  success_url: string;
  cancel_url: string;
}

export interface SubscriptionResponse {
  subscription_id: string;
  client_secret: string;
  status: string;
}

export interface SubscriptionStatusResponse {
  is_subscribed: boolean;
  is_active: boolean;
  subscription_id?: string;
  subscription_end_date?: string;
  stripe_customer_id?: string;
}

export const stripeService = {
  async createCheckoutSession(
    data: CreateCheckoutSessionRequest,
  ): Promise<CheckoutSessionResponse> {
    const response = await axios.post(
      `${API_URL}/api/stripe/create-checkout-session`,
      data,
    );
    return response.data;
  },

  async createSubscription(
    data: SubscriptionCreateRequest,
  ): Promise<SubscriptionResponse> {
    const response = await axios.post(
      `${API_URL}/api/stripe/create-subscription`,
      data,
    );
    return response.data;
  },

  async getSessionStatus(sessionId: string) {
    const response = await axios.get(
      `${API_URL}/api/stripe/session-status/${sessionId}`,
    );
    return response.data;
  },

  async getSubscriptionStatus(
    customerId: string,
  ): Promise<SubscriptionStatusResponse> {
    const response = await axios.get(
      `${API_URL}/api/stripe/subscription-status/${customerId}`,
    );
    return response.data;
  },

  async createPortalSession(returnUrl?: string, customerId?: string) {
    const response = await axios.post(
      `${API_URL}/api/stripe/create-portal-session`,
      {
        return_url: returnUrl,
      },
      {
        params: { customer_id: customerId },
      },
    );
    return response.data;
  },

  async searchCustomer(email: string) {
    const response = await axios.get(`${API_URL}/api/stripe/customers/search`, {
      params: { email },
    });
    return response.data;
  },
};

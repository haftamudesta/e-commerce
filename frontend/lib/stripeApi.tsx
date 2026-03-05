import axios from "axios";
import { authUtils } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance with default config
const stripeAxios = axios.create({
  baseURL: API_URL,
});

// Add token to requests if available
stripeAxios.interceptors.request.use((config) => {
  const token = authUtils.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
stripeAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid auth data
      authUtils.clearAuthData();
      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = `/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    return Promise.reject(error);
  },
);

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
  success_url: string;
  cancel_url: string;
  // customer_email is now optional since we use the authenticated user
  customer_email?: string;
}

export interface SubscriptionResponse {
  subscription_id: string;
  client_secret: string;
  status: string;
}

export interface CreateCustomerResponse {
  customer_id: string;
}

export interface SubscriptionStatusResponse {
  is_subscribed: boolean;
  is_active: boolean;
  subscription_id?: string;
  subscription_end_date?: string;
  stripe_customer_id?: string;
}

export interface PortalSessionResponse {
  url: string;
}

export const stripeService = {
  async createCheckoutSession(
    data: CreateCheckoutSessionRequest,
  ): Promise<CheckoutSessionResponse> {
    const response = await stripeAxios.post(
      `/api/stripe/create-checkout-session`,
      data,
    );
    return response.data;
  },

  async createSubscription(
    data: SubscriptionCreateRequest,
  ): Promise<SubscriptionResponse> {
    const response = await stripeAxios.post(
      `/api/stripe/create-subscription`,
      data,
    );
    return response.data;
  },

  async getSessionStatus(sessionId: string) {
    const response = await stripeAxios.get(
      `/api/stripe/session-status/${sessionId}`,
    );
    return response.data;
  },

  async getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
    const response = await stripeAxios.get(`/api/stripe/subscription-status`);
    return response.data;
  },

  async createPortalSession(
    returnUrl?: string,
  ): Promise<PortalSessionResponse> {
    const response = await stripeAxios.post(
      `/api/stripe/create-portal-session`,
      {
        return_url: returnUrl,
      },
    );
    return response.data;
  },

  async searchCustomer(email: string) {
    const response = await stripeAxios.get(`/api/stripe/customers/search`, {
      params: { email },
    });
    return response.data;
  },

  async createCustomer(
    email: string,
    name?: string,
  ): Promise<CreateCustomerResponse> {
    const response = await stripeAxios.post(`/api/stripe/customers`, null, {
      params: { email, name },
    });
    return response.data;
  },
};

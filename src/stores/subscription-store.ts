import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SubscriptionFrequency =
  | "every_3_days"
  | "weekly"
  | "every_2_weeks"
  | "monthly"
  | "every_6_weeks"
  | "every_2_months";

export interface ProductSubscription {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  productPrice: number;
  quantity: number;
  frequency: SubscriptionFrequency;
  discountPercent: number;
  nextDeliveryDate: string;
  lastDeliveryDate: string | null;
  status: "active" | "paused" | "cancelled";
  createdAt: string;
  totalDeliveries: number;
  totalSaved: number;
}

export const FREQUENCY_OPTIONS: {
  value: SubscriptionFrequency;
  label: string;
  days: number;
}[] = [
  { value: "every_3_days", label: "Every 3 days", days: 3 },
  { value: "weekly", label: "Every week", days: 7 },
  { value: "every_2_weeks", label: "Every 2 weeks", days: 14 },
  { value: "monthly", label: "Every month", days: 30 },
  { value: "every_6_weeks", label: "Every 6 weeks", days: 42 },
  { value: "every_2_months", label: "Every 2 months", days: 60 },
];

export const SUBSCRIPTION_DISCOUNT = 10;

function getFrequencyDays(frequency: SubscriptionFrequency): number {
  const option = FREQUENCY_OPTIONS.find((f) => f.value === frequency);
  return option?.days ?? 30;
}

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString();
}

function generateId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const FRESH_KEYWORDS = [
  "milk",
  "bread",
  "eggs",
  "lettuce",
  "spinach",
  "tomato",
  "banana",
  "apple",
  "orange",
  "berries",
  "yoghurt",
  "yogurt",
  "cream",
  "salad",
  "herb",
  "fresh",
  "juice",
];

const BIWEEKLY_KEYWORDS = [
  "meat",
  "chicken",
  "beef",
  "pork",
  "lamb",
  "fish",
  "salmon",
  "cheese",
  "crisps",
  "chips",
  "snack",
  "biscuit",
  "cereal",
  "frozen",
];

function suggestFrequencyForProduct(
  productName: string
): SubscriptionFrequency {
  const lower = productName.toLowerCase();

  if (FRESH_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "weekly";
  }

  if (BIWEEKLY_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "every_2_weeks";
  }

  return "monthly";
}

interface SubscriptionStore {
  subscriptions: ProductSubscription[];

  subscribe: (
    product: {
      id: string;
      name: string;
      image_url: string | null;
      price_pence: number;
    },
    frequency: SubscriptionFrequency,
    quantity?: number
  ) => ProductSubscription;
  unsubscribe: (subscriptionId: string) => void;
  pauseSubscription: (subscriptionId: string) => void;
  resumeSubscription: (subscriptionId: string) => void;
  updateFrequency: (
    subscriptionId: string,
    frequency: SubscriptionFrequency
  ) => void;
  updateQuantity: (subscriptionId: string, quantity: number) => void;
  skipNextDelivery: (subscriptionId: string) => void;

  isSubscribed: (productId: string) => boolean;
  getSubscription: (productId: string) => ProductSubscription | null;
  getActiveSubscriptions: () => ProductSubscription[];
  getNextDeliveryDate: () => string | null;
  getMonthlyEstimate: () => number;
  getTotalSavings: () => number;

  getSuggestedFrequency: (productName: string) => SubscriptionFrequency;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      subscriptions: [],

      subscribe: (product, frequency, quantity = 1) => {
        const now = new Date();
        const days = getFrequencyDays(frequency);

        const newSubscription: ProductSubscription = {
          id: generateId(),
          productId: product.id,
          productName: product.name,
          productImage: product.image_url,
          productPrice: product.price_pence,
          quantity,
          frequency,
          discountPercent: SUBSCRIPTION_DISCOUNT,
          nextDeliveryDate: addDays(now, days),
          lastDeliveryDate: null,
          status: "active",
          createdAt: now.toISOString(),
          totalDeliveries: 0,
          totalSaved: 0,
        };

        set((state) => ({
          subscriptions: [...state.subscriptions, newSubscription],
        }));

        return newSubscription;
      },

      unsubscribe: (subscriptionId) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === subscriptionId
              ? { ...sub, status: "cancelled" as const }
              : sub
          ),
        }));
      },

      pauseSubscription: (subscriptionId) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === subscriptionId && sub.status === "active"
              ? { ...sub, status: "paused" as const }
              : sub
          ),
        }));
      },

      resumeSubscription: (subscriptionId) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) => {
            if (sub.id !== subscriptionId || sub.status !== "paused") {
              return sub;
            }

            const now = new Date();
            const days = getFrequencyDays(sub.frequency);

            return {
              ...sub,
              status: "active" as const,
              nextDeliveryDate: addDays(now, days),
            };
          }),
        }));
      },

      updateFrequency: (subscriptionId, frequency) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) => {
            if (sub.id !== subscriptionId) return sub;

            const days = getFrequencyDays(frequency);
            const now = new Date();

            return {
              ...sub,
              frequency,
              nextDeliveryDate: addDays(now, days),
            };
          }),
        }));
      },

      updateQuantity: (subscriptionId, quantity) => {
        if (quantity <= 0) {
          get().unsubscribe(subscriptionId);
          return;
        }

        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === subscriptionId ? { ...sub, quantity } : sub
          ),
        }));
      },

      skipNextDelivery: (subscriptionId) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) => {
            if (sub.id !== subscriptionId || sub.status !== "active") {
              return sub;
            }

            const current = new Date(sub.nextDeliveryDate);
            const days = getFrequencyDays(sub.frequency);

            return {
              ...sub,
              nextDeliveryDate: addDays(current, days),
            };
          }),
        }));
      },

      isSubscribed: (productId) => {
        return get().subscriptions.some(
          (sub) => sub.productId === productId && sub.status !== "cancelled"
        );
      },

      getSubscription: (productId) => {
        return (
          get().subscriptions.find(
            (sub) => sub.productId === productId && sub.status !== "cancelled"
          ) ?? null
        );
      },

      getActiveSubscriptions: () => {
        return get().subscriptions.filter((sub) => sub.status === "active");
      },

      getNextDeliveryDate: () => {
        const active = get().getActiveSubscriptions();
        if (active.length === 0) return null;

        const sorted = [...active].sort(
          (a, b) =>
            new Date(a.nextDeliveryDate).getTime() -
            new Date(b.nextDeliveryDate).getTime()
        );

        return sorted[0].nextDeliveryDate;
      },

      getMonthlyEstimate: () => {
        const active = get().getActiveSubscriptions();

        return active.reduce((total, sub) => {
          const days = getFrequencyDays(sub.frequency);
          const discountedPrice =
            sub.productPrice * (1 - sub.discountPercent / 100);
          const monthlyDeliveries = 30 / days;

          return total + discountedPrice * sub.quantity * monthlyDeliveries;
        }, 0);
      },

      getTotalSavings: () => {
        return get().subscriptions.reduce(
          (total, sub) => total + sub.totalSaved,
          0
        );
      },

      getSuggestedFrequency: (productName) => {
        return suggestFrequencyForProduct(productName);
      },
    }),
    {
      name: "subscription-storage",
      partialize: (state) => ({
        subscriptions: state.subscriptions,
      }),
    }
  )
);

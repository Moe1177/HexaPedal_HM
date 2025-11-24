"use client";

import { useState, useEffect } from "react";
import { BillingSummary, PlanType, Subscription } from "@/types/Billing";
import { getBillingInfo } from "@/app/services/user/rider/getBillingInfo";
import { getCurrentSubscription } from "@/app/services/subscriptions/getCurrentSubscription";
import { cancelSubscription } from "@/app/services/subscriptions/cancelSubscription";
import { useAuth } from "@/hooks/useAuth";
import { getUserIdFromToken, getRoleFromToken } from "@/app/services/user/getCurrentUser";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getPaymentMethod, addPaymentMethod, PaymentMethodResponse } from "@/app/services/rider/payment";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

function PaymentFormInner({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("CA");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function validate(): string | null {
    if (!cardholderName.trim()) return "Cardholder name is required";
    if (!line1.trim()) return "Billing address is required";
    if (!city.trim()) return "City is required";
    if (!state.trim()) return "State/Province is required";
    if (!postalCode.trim()) return "Postal code is required";
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!stripe || !elements) {
      setErrorMessage("Stripe is not loaded. Please refresh the page.");
      return;
    }

    if (isSubmitting) return;

    setErrorMessage(null);

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const card = elements.getElement(CardElement);
      if (!card) {
        setErrorMessage("Card element not found");
        setIsSubmitting(false);
        return;
      }

      const cleanPostalCode = postalCode.trim().toUpperCase();

      // Create Stripe Payment Method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card,
        billing_details: {
          name: cardholderName,
          address: {
            line1,
            line2: line2 || undefined,
            city,
            state,
            postal_code: cleanPostalCode,
            country,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message || "Error creating payment method");
        setIsSubmitting(false);
        return;
      }

      // Send to backend
      await addPaymentMethod(paymentMethod.id, cardholderName, {
        line1,
        line2,
        city,
        state,
        postalCode: cleanPostalCode,
        country,
      });

      // Success
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add payment method";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="cardholderName" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
          Cardholder Name
        </label>
        <input
          type="text"
          id="cardholderName"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
          disabled={isSubmitting}
          className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
          placeholder="Name on card"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">Card Details</label>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5">
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: "16px",
                  color: "#374151",
                  "::placeholder": { color: "#9ca3af" },
                },
                invalid: { color: "#ef4444" },
              },
            }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="line1" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
          Billing Address Line 1
        </label>
        <input
          type="text"
          id="line1"
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
          required
          disabled={isSubmitting}
          className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
          placeholder="123 Main St"
        />
      </div>

      <div>
        <label htmlFor="line2" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
          Billing Address Line 2 (Optional)
        </label>
        <input
          type="text"
          id="line2"
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          disabled={isSubmitting}
          className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
          placeholder="Apt 4B"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
            City
          </label>
          <input
            type="text"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
            placeholder="City"
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
            State/Province
          </label>
          <input
            type="text"
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
            placeholder="QC"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
            Postal Code
          </label>
          <input
            type="text"
            id="postalCode"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
            placeholder="H2X 1Y2"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
            Country
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
          >
            <option value="CA">Canada</option>
            <option value="US">United States</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !stripe}
        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-lg hover:from-indigo-700 hover:to-sky-700 transition-all font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Adding payment method…" : "Add payment method"}
      </button>
    </form>
  );
}

export default function BillingView() {
  const { token } = useAuth();
  const [userId, setUserId] = useState<number | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingSummary | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodResponse | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  const [isOperator, setIsOperator] = useState(false);

  useEffect(() => {
    if (token) {
      const id = getUserIdFromToken(token);
      setUserId(id);
      const roles = getRoleFromToken(token);
      const isOp = roles?.some(r => r.authority === "ROLE_OPERATOR") || false;
      setIsOperator(isOp);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    loadBillingInfo();
    loadPaymentMethod();
  }, [token]);

  const loadBillingInfo = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Load subscription data
      const sub = await getCurrentSubscription(token);
      setSubscription(sub);

      // Try to load billing info if available
      if (true) {
        try {
          console.log(token)
          const data = await getBillingInfo(token);
          console.log(data)
          setBillingInfo(data);
        } catch (err) {
          console.error("Failed to load billing info:", err);
          // Continue without billing info
        }
      }
    } catch (err) {
      console.error("Failed to load subscription:", err);
      setError("Failed to load subscription information");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaymentMethod = async () => {
    try {
      const method = await getPaymentMethod();
      setPaymentMethod(method);
    } catch (err) {
      console.error("Failed to load payment method:", err);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccessMessage("Payment method added successfully!");
    setShowPaymentForm(false);
    setTimeout(() => setPaymentSuccessMessage(null), 5000);
    loadPaymentMethod();
  };

  const handleReplaceCard = () => {
    setShowPaymentForm(true);
    setPaymentSuccessMessage(null);
  };

  const handleCancelSubscription = async () => {
    if (!token) return;

    setIsCancelling(true);
    try {
      const cancelledSub = await cancelSubscription(token);
      setSubscription(cancelledSub);
      setShowCancelModal(false);
      alert(
        "Subscription cancelled successfully. It will remain active until the end of the current billing period."
      );
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
      alert("Failed to cancel subscription. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const getMockBillingInfo = (): BillingSummary => {
    return {
      currentPlan: {
        id: 1,
        type: "MONTHLY",
        name: "Monthly Pass",
        description: "Unlimited rides for a month",
        price: 29.99,
        currency: "USD",
        billingCycle: "monthly",
        features: [
          "Unlimited rides",
          "No additional fees",
          "Priority support",
          "Cancel anytime",
        ],
        validUntil: "2024-12-31T23:59:59Z",
        isActive: true,
      },
      totalSpent: 156.78,
      ridesThisMonth: 24,
      ridesThisYear: 156,
      nextBillingDate: "2024-12-01T00:00:00Z",
      billingHistory: [
        {
          id: 1,
          date: "2024-11-01T00:00:00Z",
          description: "Monthly Pass - November",
          amount: 29.99,
          currency: "USD",
          status: "paid",
          type: "subscription",
        },
        {
          id: 2,
          date: "2024-10-15T14:30:00Z",
          description: "Ride #1234",
          amount: 2.5,
          currency: "USD",
          status: "paid",
          type: "ride",
        },
      ],
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPlanBadgeColor = (type: PlanType) => {
    switch (type) {
      case "MONTHLY":
        return "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400";
      case "YEARLY":
        return "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400";
      case "PAY_PER_TRIP":
        return "bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400";
    }
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400";
      case "CANCELLED":
        return "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400";
      case "EXPIRED":
        return "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400";
      case "pending":
        return "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400";
      case "failed":
        return "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400";
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !billingInfo) {
    return (
      <div className="h-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const plan = billingInfo?.currentPlan;

  return (
    <div className="h-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Billing & Payment
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Manage your subscription and view billing history
          </p>
        </div>

        {/* Current Subscription Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 mb-6">
          {subscription ? (
            <>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      Current Subscription
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(
                        subscription.planType
                      )}`}
                    >
                      {subscription.planName}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getSubscriptionStatusColor(
                        subscription.status
                      )}`}
                    >
                      {subscription.status}
                    </span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {subscription.planType === "MONTHLY" &&
                      "Best for regular commuters"}
                    {subscription.planType === "YEARLY" && "Maximum savings"}
                    {subscription.planType === "PAY_PER_TRIP" &&
                      "Perfect for occasional riders"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                    ${subscription.planPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {subscription.planType === "MONTHLY" && "/month"}
                    {subscription.planType === "YEARLY" && "/year"}
                    {subscription.planType === "PAY_PER_TRIP" && "/trip"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                    Current Period Start
                  </p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatDate(subscription.currentPeriodStart)}
                  </p>
                </div>
                <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                    Current Period End
                  </p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    Subscription will be cancelled at the end of the current
                    period
                  </p>
                </div>
              )}

              {subscription.status === "ACTIVE" &&
                !subscription.cancelAtPeriodEnd && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors font-medium"
                  >
                    Cancel Subscription
                  </button>
                )}
            </>
          ) : (
            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                Bike Pricing Plans
              </h3>
              {isOperator && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    🎯 Operator Discount: You receive a <strong>15% discount</strong> on all trips (applied after loyalty discounts)
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Standard Bike Plan */}
                <div className="p-6 bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-900/20 dark:to-sky-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      Standard Bike
                    </h4>
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
                      STANDARD
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    $1.00 base fee
                  </p>
                  <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                    + $0.02/minute
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Pay per trip pricing for standard bikes
                  </p>
                </div>

                {/* Electric Bike Plan */}
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      Electric Bike
                    </h4>
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">
                      ELECTRIC
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    $3.00 base fee
                  </p>
                  <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                    + $0.05/minute
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Pay per trip pricing for electric bikes
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Method Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Payment Method
          </h2>

          {paymentSuccessMessage && (
            <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{paymentSuccessMessage}</p>
            </div>
          )}

          {paymentMethod && !showPaymentForm ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <svg className="w-12 h-8 text-neutral-400" fill="currentColor" viewBox="0 0 48 32">
                  <rect width="48" height="32" rx="4" />
                </svg>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {paymentMethod.brand.toUpperCase()} •••• {paymentMethod.last4}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Expires {paymentMethod.expMonth.toString().padStart(2, "0")}/{paymentMethod.expYear}
                  </p>
                </div>
                {paymentMethod.isDefault && (
                  <span className="ml-auto px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
                    Default
                  </span>
                )}
              </div>
              <button
                onClick={handleReplaceCard}
                className="px-6 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-medium"
              >
                Replace Card
              </button>
            </div>
          ) : showPaymentForm ? (
            <div>
              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <PaymentFormInner onSuccess={handlePaymentSuccess} />
                </Elements>
              ) : (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <strong>Stripe configuration error.</strong> Check your NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                  </p>
                </div>
              )}
              {paymentMethod && (
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  ← Cancel
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                No payment method on file. Add a card to manage your subscriptions.
              </p>
              <button
                onClick={() => setShowPaymentForm(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-lg hover:from-indigo-700 hover:to-sky-700 transition-all font-semibold"
              >
                Add Payment Method
              </button>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              Total Spent
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              ${(billingInfo?.totalSpent ?? 0).toFixed(2)}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
              All time
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              Rides This Month
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {billingInfo?.ridesThisMonth || 0}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
              Current month
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              Rides This Year
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {billingInfo?.ridesThisYear || 0}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
              Current year
            </p>
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Billing History
          </h2>
          {billingInfo?.billingHistory &&
          billingInfo.billingHistory.length > 0 ? (
            <div className="space-y-4">
              {billingInfo.billingHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {item.description}
                      </p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status.charAt(0).toUpperCase() +
                          item.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {formatDate(item.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      ${item.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">
                      {item.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-600 dark:text-neutral-400">
                No billing history available
              </p>
            </div>
          )}
        </div>

        {subscription && subscription.currentPeriodEnd && (
          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              Next billing date
            </p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
        )}
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full border border-neutral-200 dark:border-neutral-700">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                Cancel Subscription
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Are you sure you want to cancel your subscription? You will
                continue to have access until the end of your current billing
                period.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors font-medium"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCancelling ? "Cancelling..." : "Cancel Subscription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getPaymentMethod, addPaymentMethod, PaymentMethodResponse } from "@/app/services/operator/payment";

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
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="cardholderName" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
          Cardholder Name
        </label>
        <input
          type="text"
          id="cardholderName"
          name="cardholderName"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
          disabled={isSubmitting}
          className="w-full px-5 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Name on card"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">Card Details</label>
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-5 py-3.5">
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
          name="line1"
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
          required
          disabled={isSubmitting}
          className="w-full px-5 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          name="line2"
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          disabled={isSubmitting}
          className="w-full px-5 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Apt 4B"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-5 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            name="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-5 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="QC"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
            Postal Code
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-5 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="H2X 1Y2"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
            Country
          </label>
          <select
            id="country"
            name="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-5 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="CA">Canada</option>
            <option value="US">United States</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {errorMessage}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !stripe}
        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-xl hover:from-indigo-700 hover:to-sky-700 transition-all font-semibold shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:from-indigo-600 disabled:hover:to-sky-600"
      >
        {isSubmitting ? "Adding payment method…" : "Add payment method"}
      </button>
    </form>
  );
}

function PaymentSettingsContent() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadPaymentMethod() {
    setIsLoading(true);
    try {
      const method = await getPaymentMethod();
      setPaymentMethod(method);
      setShowForm(!method); // Show form if no payment method exists
    } catch (err) {
      console.error("Failed to load payment method:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPaymentMethod();
  }, []);

  function handleSuccess() {
    setSuccessMessage("Payment method added successfully!");
    setShowForm(false);
    setTimeout(() => setSuccessMessage(null), 5000);
    loadPaymentMethod();
  }

  function handleReplaceCard() {
    setShowForm(true);
    setSuccessMessage(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading payment information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Payment Settings
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Manage your payment information for receiving payments
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
            {successMessage}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 border border-neutral-200 dark:border-neutral-800">
        {paymentMethod && !showForm ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  Current Payment Method
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
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
                  </div>
                  {paymentMethod.isDefault && (
                    <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
                      Default
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={handleReplaceCard}
                className="px-6 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-medium"
              >
                Replace Card
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
              {paymentMethod ? "Add New Payment Method" : "Add Payment Method"}
            </h2>
            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <PaymentFormInner onSuccess={handleSuccess} />
              </Elements>
            ) : (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400">
                  <strong>Stripe configuration error.</strong> Check your NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                </p>
              </div>
            )}
            {paymentMethod && (
              <button
                onClick={() => setShowForm(false)}
                className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                ← Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSettings() {
  return <PaymentSettingsContent />;
}


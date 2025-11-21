"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  initializeGuestSession,
  startGuestTrip,
  BillingAddress,
} from "@/app/services/guest/guestSessionService";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface GuestPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bikeId: number;
  onSuccess: (guestToken: string) => void;
}

function GuestPaymentFormInner({
  bikeId,
  onSuccess,
  onClose,
}: {
  bikeId: number;
  onSuccess: (token: string) => void;
  onClose: () => void;
}) {
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

      // Initialize guest session with payment method
      const billingAddress: BillingAddress = {
        line1,
        line2,
        city,
        state,
        postalCode: cleanPostalCode,
        country,
      };

      const guestSession = await initializeGuestSession(
        paymentMethod.id,
        billingAddress,
        cardholderName
      );

      // Small delay to ensure database transaction is fully committed
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Start the trip after guest session is created and committed
      await startGuestTrip(bikeId, guestSession.token);

      // Success - call the parent callback with the guest token
      onSuccess(guestSession.token);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to initialize guest session";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div>
        <label
          htmlFor="cardholderName"
          className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300"
        >
          Cardholder Name
        </label>
        <input
          type="text"
          id="cardholderName"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          placeholder="John Doe"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
          Card Information
        </label>
        <div className="p-4 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#1f2937",
                  "::placeholder": {
                    color: "#9ca3af",
                  },
                },
                invalid: {
                  color: "#ef4444",
                },
              },
            }}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="line1"
          className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300"
        >
          Billing Address
        </label>
        <input
          type="text"
          id="line1"
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          placeholder="123 Main St"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label
          htmlFor="line2"
          className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300"
        >
          Apartment, suite, etc. (optional)
        </label>
        <input
          type="text"
          id="line2"
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          placeholder="Apt 4B"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300"
          >
            City
          </label>
          <input
            type="text"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            placeholder="Montreal"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label
            htmlFor="state"
            className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300"
          >
            Province
          </label>
          <input
            type="text"
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            placeholder="QC"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="postalCode"
            className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300"
          >
            Postal Code
          </label>
          <input
            type="text"
            id="postalCode"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            placeholder="H3A 0G4"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label
            htmlFor="country"
            className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300"
          >
            Country
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            disabled={isSubmitting}
          >
            <option value="CA">Canada</option>
            <option value="US">United States</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isSubmitting}
          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? "Processing..." : "Pay & Unlock Bike"}
        </button>
      </div>
    </form>
  );
}

export default function GuestPaymentModal({
  isOpen,
  onClose,
  bikeId,
  onSuccess,
}: GuestPaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Rent Bike as Guest
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              No account needed!
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Simply add your payment information to unlock the bike and start
              your ride. You'll only be charged for the time you use the bike.
            </p>
          </div>

          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <GuestPaymentFormInner
                bikeId={bikeId}
                onSuccess={onSuccess}
                onClose={onClose}
              />
            </Elements>
          ) : (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                Payment system is not configured. Please contact support.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

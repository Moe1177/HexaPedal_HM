"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripeKey) {
  console.error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

function AddCardForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [cardholderName, setCardholderName] = useState("");
  const [status, setStatus] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    const result = await stripe.createPaymentMethod({
      type: "card",
      card,
      billing_details: { name: cardholderName },
    });

    if (result.error) {
      setStatus(result.error.message || "Error");
      return;
    }

    setStatus("Card saved successfully!");
  };

  return (
    <div className="p-4 max-w-md">
      <form onSubmit={submit}>
        <input
          className="border w-full p-2 mb-2 rounded"
          placeholder="Cardholder Name"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
        />
        <div className="border p-3 mb-3 rounded">
          <CardElement options={{ style: { base: { fontSize: '16px', color: '#000' } } }} />
        </div>
        <button className="bg-black text-white px-4 py-2 rounded w-full" disabled={!stripe}>
          Save Card
        </button>
      </form>
      {status && <p className="mt-3">{status}</p>}
    </div>
  );
}

export default function AddStripeCard() {
  if (!stripePromise) {
    return <div className="p-4 bg-red-50 text-red-800 rounded">Stripe configuration error. Check your .env.local file.</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      <AddCardForm />
    </Elements>
  );
}

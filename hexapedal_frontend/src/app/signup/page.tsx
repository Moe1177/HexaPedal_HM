"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

function SignUpForm() {
  const stripe = useStripe();
  const elements = useElements();

  // User information
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");

  // Payment information
  const [cardholderName, setCardholderName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("CA");

  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setStatus("");

    try {
      const card = elements.getElement(CardElement);
      if (!card) {
        setStatus("Card element not found");
        setIsLoading(false);
        return;
      }

      // Remove extra spaces from postal code
      const cleanPostalCode = postalCode.trim().toUpperCase();

      // Step 1: Create Stripe Payment Method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card,
        billing_details: {
          name: cardholderName,
          email,
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
        setStatus(error.message || "Error creating payment method");
        setIsLoading(false);
        return;
      }

      // Step 2: Send user and payment info to your backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          address,
          username,
          email,
          password,
          stripePaymentMethodId: paymentMethod.id,
          cardholderName,
          billingAddress: {
            line1,
            line2,
            city,
            state,
            postalCode: cleanPostalCode,
            country,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setStatus(errorData.message || `Registration failed: ${res.statusText}`);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (data.token) localStorage.setItem("token", data.token);

      setStatus("Registration successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (error) {
      console.error("Error during registration:", error);
      setStatus("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create Your Account</h1>

      <div className="space-y-6">
        {/* Personal Information */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Personal Information</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="border w-full p-3 rounded"
              required
            />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border w-full p-3 rounded"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border w-full p-3 rounded"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border w-full p-3 rounded"
              required
            />
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="border w-full p-3 rounded"
              required
            />
          </div>
        </div>

        {/* Payment Information */}
        <div className="border rounded-lg p-6 bg-blue-50">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Payment Information</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Cardholder Name"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              className="border w-full p-3 rounded bg-white"
              required
            />
            <div className="border p-4 rounded bg-white">
              // In your SignUpForm component

            <CardElement
            options={{
                hidePostalCode: true, // <-- Add this line
                style: {
                base: {
                    fontSize: "16px",
                    color: "#000",
                    "::placeholder": { color: "#aab7c4" },
                },
                invalid: { color: "#ef4444" },
                },
            }}
            />
            </div>
            <input
              type="text"
              placeholder="Billing Address Line 1"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              className="border w-full p-3 rounded bg-white"
              required
            />
            <input
              type="text"
              placeholder="Billing Address Line 2 (Optional)"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              className="border w-full p-3 rounded bg-white"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="border w-full p-3 rounded bg-white"
                required
              />
              <input
                type="text"
                placeholder="State/Province"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="border w-full p-3 rounded bg-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Postal Code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="border w-full p-3 rounded bg-white"
                required
              />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="border w-full p-3 rounded bg-white"
                required
              >
                <option value="CA">Canada</option>
                <option value="US">United States</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!stripe || isLoading}
          className="bg-black text-white px-6 py-4 rounded w-full text-lg font-semibold disabled:bg-gray-400"
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </button>
      </div>

      {status && <div className="mt-4 p-4 rounded font-medium bg-red-100 text-red-800">{status}</div>}
    </div>
  );
}

export default function SignUpPage() {
  if (!stripePromise) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded max-w-md mx-auto mt-10 border border-red-300">
        <strong>Stripe configuration error.</strong> Check your NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <SignUpForm />
    </Elements>
  );
}

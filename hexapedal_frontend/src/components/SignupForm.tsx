"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

type RegisterPayload = {
  fullName: string;
  address: string;
  username: string;
  email: string;
  password: string;
  stripePaymentMethodId?: string;
  cardholderName?: string;
  billingAddress?: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
};

function SignupFormInner() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  // User
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState<boolean | null>(null);
  const [usernameTaken, setUsernameTaken] = useState<boolean | null>(null);

  // Payment
  const [cardholderName, setCardholderName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("CA");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  
  async function checkEmailAvailability(value: string) {
    setEmailTaken(null);
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return;
    try {
      const res = await fetch(`${apiBaseUrl}/auth/check-email?email=${encodeURIComponent(value)}`);
      if (res.ok) {
        const exists = await res.json();
        setEmailTaken(Boolean(exists));
      }
    } catch {}
  }

  async function checkUsernameAvailability(value: string) {
    setUsernameTaken(null);
    if (!value) return;
    try {
      const res = await fetch(`${apiBaseUrl}/auth/check-username?username=${encodeURIComponent(value)}`);
      if (res.ok) {
        const exists = await res.json();
        setUsernameTaken(Boolean(exists));
      }
    } catch {}
  }

  function validate(): string | null {
    if (!fullName.trim()) return "Full name is required";
    if (!address.trim()) return "Address is required";
    if (!username.trim()) return "Username is required";
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    
    // Payment validation
    if (!cardholderName.trim()) return "Cardholder name is required";
    if (!line1.trim()) return "Billing address is required";
    if (!city.trim()) return "City is required";
    if (!state.trim()) return "State/Province is required";
    if (!postalCode.trim()) return "Postal code is required";
    
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripe || !elements) {
      setErrorMessage("Stripe is not loaded. Please refresh the page.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (emailTaken) {
      setErrorMessage("Email already in use");
      return;
    }
    if (usernameTaken) {
      setErrorMessage("Username already in use");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create Stripe Payment Method
      const card = elements.getElement(CardElement);
      if (!card) {
        setErrorMessage("Card element not found");
        setIsSubmitting(false);
        return;
      }

      const cleanPostalCode = postalCode.trim().toUpperCase();

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
        setErrorMessage(error.message || "Error creating payment method");
        setIsSubmitting(false);
        return;
      }

      // Step 2: Send user and payment info to backend
      const payload: RegisterPayload = {
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
      };

      const res = await fetch(`${apiBaseUrl}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = "Signup failed";
        try {
          const errorData = await res.json();
          message = errorData.message || res.statusText || message;
        } catch {
          message = res.statusText || message;
        }
        throw new Error(message);
      }

      setSuccessMessage("Registration successful. Please check your email for the verification code.");
      const params = new URLSearchParams({ email });
      setTimeout(() => router.push(`/verify?${params.toString()}`), 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl space-y-6">
      {/* Personal Information Section */}
      <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-xl font-semibold text-gray-100">Personal Information</h2>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-200">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-gray-500"
              placeholder="Full Name"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="username" className="block text-sm font-medium text-gray-200">
              Username
            </label>
            <input
              id="username"
              name="username"
              value={username}
              onChange={(e) => {
                const v = e.target.value;
                setUsername(v);
                checkUsernameAvailability(v);
              }}
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-gray-500"
              placeholder="username"
              disabled={isSubmitting}
              required
            />
            {usernameTaken === true && (
              <p className="text-xs text-red-400">Username already in use</p>
            )}
            {usernameTaken === false && (
              <p className="text-xs text-emerald-400">Username available</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="address" className="block text-sm font-medium text-gray-200">
            Address
          </label>
          <input
            id="address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-gray-500"
            placeholder="address"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-200">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              const v = e.target.value;
              setEmail(v);
              checkEmailAvailability(v);
            }}
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-gray-500"
            placeholder="email@org.com"
            disabled={isSubmitting}
            required
          />
          {emailTaken === true && (
            <p className="text-xs text-red-400">Email already in use</p>
          )}
          {emailTaken === false && (
            <p className="text-xs text-emerald-400">Email available</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-200">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-gray-500"
            placeholder="••••••••"
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      {/* Payment Information Section */}
      <div className="space-y-4 rounded-lg border border-blue-700 bg-blue-900/20 p-6">
        <h2 className="text-xl font-semibold text-gray-100">Payment Information</h2>
        
        <div className="space-y-1">
          <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-200">
            Cardholder Name
          </label>
          <input
            id="cardholderName"
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-gray-500"
            placeholder="Name on card"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-200">Card Details</label>
          <div className="rounded-md border border-gray-700 bg-gray-900 px-3 py-3">
            <CardElement
              options={{
                hidePostalCode: true,
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#f3f4f6",
                    "::placeholder": { color: "#9ca3af" },
                  },
                  invalid: { color: "#ef4444" },
                },
              }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="line1" className="block text-sm font-medium text-gray-200">
            Billing Address Line 1
          </label>
          <input
            id="line1"
            type="text"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-gray-500"
            placeholder="123 Main St"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="line2" className="block text-sm font-medium text-gray-200">
            Billing Address Line 2 (Optional)
          </label>
          <input
            id="line2"
            type="text"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-gray-500"
            placeholder="Apt 4B"
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="city" className="block text-sm font-medium text-gray-200">
              City
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-gray-500"
              placeholder="City"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="state" className="block text-sm font-medium text-gray-200">
              State/Province
            </label>
            <input
              id="state"
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-gray-500"
              placeholder="QC"
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-200">
              Postal Code
            </label>
            <input
              id="postalCode"
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-gray-500"
              placeholder="H2X 1Y2"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="country" className="block text-sm font-medium text-gray-200">
              Country
            </label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-gray-500"
              disabled={isSubmitting}
              required
            >
              <option value="CA">Canada</option>
              <option value="US">United States</option>
            </select>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-400" role="alert">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="text-sm text-emerald-400" role="status">{successMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !stripe}
        className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

export default function SignupForm() {
  if (!stripePromise) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded border border-red-700 bg-red-900/20 p-4 text-red-400">
        <strong>Stripe configuration error.</strong> Check your NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <SignupFormInner />
    </Elements>
  );
}
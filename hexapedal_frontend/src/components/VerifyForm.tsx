"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type VerifyFormProps = {
  initialEmail?: string;
};

export default function VerifyForm({ initialEmail = "" }: VerifyFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  function validate(): string | null {
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email";
    if (!code.trim()) return "Verification code is required";
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationCode: code }),
      });

      if (!res.ok) {
        // Prefer plain text (backend returns a string message on 400), fall back to status text
        let message = "Verification failed";
        try {
          const text = await res.text();
          message = text || res.statusText || message;
        } catch {}
        throw new Error(message);
      }

      setSuccessMessage("Verified! You can now sign in.");
      setTimeout(() => router.push("/login"), 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-gray-200">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-gray-500"
          placeholder="email@org.com"
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="code" className="block text-sm font-medium text-gray-200">Verification code</label>
        <input
          id="code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 outline-none focus:border-gray-500"
          placeholder="Enter the code sent to your email"
          disabled={isSubmitting}
          required
        />
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-400" role="alert">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="text-sm text-emerald-400" role="status">{successMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Verifying…" : "Verify"}
      </button>
    </form>
  );
}



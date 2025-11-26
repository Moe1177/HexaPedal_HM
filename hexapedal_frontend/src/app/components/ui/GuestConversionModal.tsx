"use client";

import { useState } from "react";
import {
  convertGuestAccount,
  deleteGuestAccount,
} from "@/app/services/guest/guestSessionService";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/app/services/utils/constants";

interface GuestConversionModalProps {
  isOpen: boolean;
  guestToken: string;
  onConversionSuccess: (newToken: string) => void;
  onDecline: () => void;
}

export default function GuestConversionModal({
  isOpen,
  guestToken,
  onConversionSuccess,
  onDecline,
}: GuestConversionModalProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDecline = async () => {
    try {
      await deleteGuestAccount(guestToken);
      onDecline();
    } catch (err) {
      console.error("Failed to delete guest account:", err);
      onDecline(); 
    }
  };

  const handleCreateAccount = () => {
    setShowForm(true);
  };

  const validateForm = (): string | null => {
    if (!fullName.trim()) return "Full name is required";
    if (!email.trim()) return "Email is required";
    if (!email.includes("@")) return "Please enter a valid email";
    if (!username.trim()) return "Username is required";
    if (username.length < 3) return "Username must be at least 3 characters";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await convertGuestAccount(
        fullName,
        email,
        username,
        password,
        guestToken
      );

      // Show verification code input
      setShowForm(false);
      setShowVerification(true);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create account";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Call the verify endpoint
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationCode }),
      });

      console.log("Verification response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Verification failed:", errorText);
        throw new Error(errorText || "Verification failed");
      }

      console.log("Email verified successfully, attempting login...");

      // login with the credentials
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("Login response status:", loginResponse.status);

      if (!loginResponse.ok) {
        const loginError = await loginResponse.text();
        console.error("Login failed:", loginError);
        throw new Error(loginError || "Login failed after verification");
      }

      const loginData = await loginResponse.json();
      console.log("Login successful, redirecting to dashboard...");

      // Clear guest session from sessionStorage
      sessionStorage.removeItem("guest_token");
      sessionStorage.removeItem("guest_user_id");

      // Store new token in localStorage
      localStorage.setItem("auth_token", loginData.token);

      // Call parent callback with new token
      onConversionSuccess(loginData.token);

      alert("Account verified successfully! Welcome to HexaPedal!");

      // Reload the page
      window.location.href = "/dashboard/rider";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Verification failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[3000] p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full">
        {!showForm && !showVerification ? (
          <>
            {/* Initial Choice Screen */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-emerald-600 dark:text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                  Trip Complete!
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Your payment has been processed.
                </p>
              </div>

              <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                  Want to track your rides?
                </h3>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  Create an account to save your ride history, earn loyalty
                  rewards, and get exclusive benefits!
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCreateAccount}
                  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Create Account
                </button>
                <button
                  onClick={handleDecline}
                  className="w-full px-6 py-3 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  No Thanks
                </button>
              </div>
            </div>
          </>
        ) : showVerification ? (
          <>
            {/* Verification Code Screen */}
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Verify Your Email
              </h2>
            </div>

            <form onSubmit={handleVerificationSubmit} className="p-6 space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  We've sent a 6-digit verification code to
                </p>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
                  {email}
                </p>
              </div>

              <div>
                <label
                  htmlFor="verificationCode"
                  className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300"
                >
                  Verification Code
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  placeholder="000000"
                  maxLength={6}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || verificationCode.length !== 6}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? "Verifying..." : "Verify & Continue"}
              </button>

              <p className="text-xs text-center text-neutral-500 dark:text-neutral-400 mt-4">
                Didn't receive the code? Check your spam folder or try again.
              </p>
            </form>
          </>
        ) : (
          <>
            {/* Registration Form */}
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Create Your Account
              </h2>
              <button
                onClick={handleDecline}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  placeholder="John Doe"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  placeholder="john@example.com"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  placeholder="johndoe"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSubmitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

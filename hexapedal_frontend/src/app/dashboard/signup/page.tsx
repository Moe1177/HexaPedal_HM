"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { API_BASE_URL } from "@/app/services/utils/constants";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState<boolean | null>(null);
  const [usernameTaken, setUsernameTaken] = useState<boolean | null>(null);

  async function checkEmailAvailability(value: string) {
    setEmailTaken(null);
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/check-email?email=${encodeURIComponent(value)}`);
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
      const res = await fetch(`${API_BASE_URL}/auth/check-username?username=${encodeURIComponent(value)}`);
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
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("handleSubmit called");
    
    if (isSubmitting) {
      console.log("Already submitting, returning");
      return;
    }

    console.log("Starting validation...");
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validate();
    if (validationError) {
      console.log("Validation error:", validationError);
      setErrorMessage(validationError);
      return;
    }

    console.log("Validation passed, checking email/username availability...");
    
    if (emailTaken === true) {
      console.log("Email already taken");
      setErrorMessage("Email already in use");
      return;
    }
    if (usernameTaken === true) {
      console.log("Username already taken");
      setErrorMessage("Username already in use");
      return;
    }
    
    console.log("All checks passed, starting submission...");
    setIsSubmitting(true);
    try {
      const payload = {
        fullName,
        address,
        username,
        email,
        password,
      };
      
      console.log("Submitting signup request...", payload);
      
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", res.status, res.statusText);

      if (!res.ok) {
        let message = "Signup failed";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            message = data.message || data || "Signup failed";
          } else {
            const text = await res.text();
            message = text || "Signup failed";
          }
        } catch (e) {
          message = res.statusText || "Signup failed";
        }
        console.error("Signup error:", message);
        throw new Error(message);
      }

      const responseData = await res.json();
      console.log("Signup successful:", responseData);
      
      setSuccessMessage("Registration successful! Your account has been created. Please log in to continue.");
      setTimeout(() => {
        setIsSubmitting(false);
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error("Signup catch error:", err);
      const message = err instanceof Error ? err.message : "Signup failed";
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-sky-500">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L22 7L22 17L12 22L2 17L2 7L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
              HexaPedal
            </span>
          </Link>
          <h1 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
            Create your account
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            Join HexaPedal as a rider
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl p-10 border border-neutral-100 dark:border-neutral-800">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                Full name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-5 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={(e) => {
                  const v = e.target.value;
                  setUsername(v);
                  checkUsernameAvailability(v);
                }}
                required
                disabled={isSubmitting}
                className="w-full px-5 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="johndoe"
              />
              {usernameTaken === true && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">Username already in use</p>
              )}
              {usernameTaken === false && (
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">Username available</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-5 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="123 Main St, City, State"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => {
                  const v = e.target.value;
                  setEmail(v);
                  checkEmailAvailability(v);
                }}
                required
                disabled={isSubmitting}
                className="w-full px-5 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="you@example.com"
              />
              {emailTaken === true && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">Email already in use</p>
              )}
              {emailTaken === false && (
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">Email available</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full px-5 py-3.5 pr-12 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isSubmitting}
                  className="absolute inset-y-0 right-0 inline-flex items-center px-4 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full px-5 py-3.5 pr-12 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  disabled={isSubmitting}
                  className="absolute inset-y-0 right-0 inline-flex items-center px-4 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 disabled:opacity-50"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {errorMessage}
                </p>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
                  {successMessage}
                </p>
              </div>
            )}

            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                disabled={isSubmitting}
                className="mt-1 w-4 h-4 text-indigo-600 border-neutral-300 rounded focus:ring-indigo-500 disabled:opacity-50"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                I agree to the{" "}
                <Link href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-xl hover:from-indigo-700 hover:to-sky-700 transition-all font-semibold shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:from-indigo-600 disabled:hover:to-sky-600"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RegisterPayload = {
  fullName: string;
  address: string;
  username: string;
  email: string;
  password: string;
};

type SignupFormProps = {
  defaultRole?: string;
  onSuccess?: () => void;
};

export default function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  //const [role, setRole] = useState(defaultRole);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState<boolean | null>(null);
  const [usernameTaken, setUsernameTaken] = useState<boolean | null>(null);

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
      const payload: RegisterPayload = {
        fullName,
        address,
        username,
        email,
        password,
      };
      const res = await fetch(`${apiBaseUrl}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = "Signup failed";
        try {
          const text = await res.text();
          message = text || res.statusText || message;
        } catch {}
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
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-xl space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-200">Full name</label>
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
          <label htmlFor="username" className="block text-sm font-medium text-gray-2 00">Username</label>
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
        <label htmlFor="address" className="block text-sm font-medium text-gray-200">Address</label>
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
        <label htmlFor="email" className="block text-sm font-medium text-gray-200">Email</label>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-200">Password</label>
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
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}



"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getEmailFromToken, getUserIdFromToken } from "@/app/services/user/getCurrentUser";
import { logout } from "@/app/services/authentication/authService";
import { useRouter } from "next/navigation";

export default function ProfileView() {
  const { token, setToken } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const userEmail = getEmailFromToken(token);
      const id = getUserIdFromToken(token);
      setEmail(userEmail);
      if (id !== null && !isNaN(id) && typeof id === 'number') {
        setUserId(id);
      } else {
        setUserId(null);
      }
    }
    setIsLoading(false);
  }, [token]);

  const handleLogout = () => {
    logout(setToken);
    router.push("/");
  };

  const getInitials = (email: string | null) => {
    if (!email) return "U";
    const parts = email.split("@")[0];
    if (parts.length >= 2) {
      return parts.substring(0, 2).toUpperCase();
    }
    return parts.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="h-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Profile</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-2xl font-bold">
              {getInitials(email)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                {email ? email.split("@")[0] : "User"}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">{email || "No email available"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {email && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Email Address
                </label>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <p className="text-neutral-900 dark:text-neutral-100">{email}</p>
                </div>
              </div>
            )}

            {userId !== null && !isNaN(userId) && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  User ID
                </label>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <p className="text-neutral-900 dark:text-neutral-100">{userId}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Account Actions</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Sign Out</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Sign out of your account and return to the login page
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 mt-6">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Account Information</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-neutral-200 dark:border-neutral-700">
              <span className="text-neutral-600 dark:text-neutral-400">Account Type</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">Rider</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-neutral-600 dark:text-neutral-400">Status</span>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


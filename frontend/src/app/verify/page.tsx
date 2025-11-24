"use client";

import { useSearchParams } from "next/navigation";
import VerifyForm from "@/components/VerifyForm";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center p-6">
      <div className="w-full rounded-lg border border-gray-800 bg-gray-950 p-6 shadow">
        <h1 className="mb-4 text-center text-2xl font-semibold text-gray-100">Verify your account</h1>
        <VerifyForm initialEmail={email} />
      </div>
    </main>
  );
}



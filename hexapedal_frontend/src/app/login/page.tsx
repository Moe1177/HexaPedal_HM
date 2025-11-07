import LoginForm from "@/components/LoginForm";

export default function Login() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center p-6">
      <div className="w-full rounded-lg border border-gray-800 bg-gray-950 p-6 shadow">
        <h1 className="mb-4 text-center text-2xl font-semibold text-gray-100">Sign in</h1>
        <LoginForm />
      </div>
    </main>
  );
}
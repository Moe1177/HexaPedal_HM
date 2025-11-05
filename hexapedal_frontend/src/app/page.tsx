export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Hexapedal</h1>
        <p className="text-xl mb-8">Payment Management System</p>
        <a 
          href="/billing" 
          className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800"
        >
          Go to Billing
        </a>
      </div>
    </main>
  );
}
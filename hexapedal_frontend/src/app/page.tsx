import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <nav className="container mx-auto px-6 py-6 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-sky-500">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L22 7L22 17L12 22L2 17L2 7L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
              HexaPedal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-5 py-2.5 text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-sm"
            >
              Log In
            </Link>
            <Link
              href="/dashboard/signup"
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-sky-500 text-white rounded-xl hover:from-indigo-600 hover:to-sky-600 transition-all font-semibold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
      <section className="container mx-auto px-6 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent leading-tight tracking-tight">
            Ride Smart, Ride Green
          </h1>
          <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 mb-8 font-light">
            Affordable bike sharing passes for your daily commute and adventures
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg p-8 border border-neutral-100 dark:border-neutral-800 hover:shadow-2xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all hover:-translate-y-1">
            <div className="mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">One-Time Pass</h3>
              <p className="text-gray-600 dark:text-gray-400">Perfect for occasional riders</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">$5</span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">/ride</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>1 hour unlimited rides</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Access all stations</span>
          </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>No commitment</span>
          </li>
            </ul>
            <Link
              href="/signup"
              className="block w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all font-semibold text-center shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
            >
              Get Started
            </Link>
          </div>

          <div className="bg-gradient-to-br from-white to-sky-50 dark:from-neutral-900 dark:to-neutral-800 rounded-3xl shadow-2xl p-8 border-2 border-indigo-500 dark:border-indigo-400 hover:shadow-indigo-500/20 transition-all hover:-translate-y-1 relative">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-sky-600 text-white px-5 py-1.5 rounded-bl-2xl rounded-tr-3xl text-xs font-bold tracking-wide">
              Popular
            </div>
            <div className="mb-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">Monthly Pass</h3>
              <p className="text-gray-600 dark:text-gray-400">Best for regular commuters</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">$29</span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Unlimited rides</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Priority access</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>24/7 customer support</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Cancel anytime</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="block w-full py-3.5 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-xl hover:from-indigo-700 hover:to-sky-700 transition-all font-semibold text-center shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40"
            >
              Get Started
            </Link>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-lg p-8 border border-neutral-100 dark:border-neutral-800 hover:shadow-2xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all hover:-translate-y-1">
            <div className="mb-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">Yearly Pass</h3>
              <p className="text-gray-600 dark:text-gray-400">Maximum savings</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">$299</span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">/year</span>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">Save $49 (14% off)</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Unlimited rides</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>All monthly benefits</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Free bike maintenance</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Special member events</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="block w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all font-semibold text-center shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 dark:border-slate-700 mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-500 to-sky-500">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L22 7L22 17L12 22L2 17L2 7L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-xl font-bold">HexaPedal</span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              © 2024 HexaPedal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

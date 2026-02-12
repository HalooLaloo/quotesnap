import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a1628]">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-[#132039] border border-[#1e3a5f] flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-slate-500">404</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-slate-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition"
          >
            Go to homepage
          </Link>
          <Link
            href="/login"
            className="border border-slate-600 hover:border-slate-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

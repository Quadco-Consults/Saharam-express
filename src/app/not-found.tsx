import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-9xl font-bold text-saharam-500">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-saharam-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-saharam-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
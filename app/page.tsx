import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Welcome to MOE Admin
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Choose your destination
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link 
            href="/admin"
            className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-200"
          >
            Admin Dashboard
          </Link>
          
          <Link 
            href="/wallet"
            className="px-8 py-4 bg-emerald-600 text-white rounded-lg font-semibold text-lg hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-200"
          >
            Wallet
          </Link>
           <Link 
            href="/wallet"
            className="px-8 py-4 bg-emerald-600 text-white rounded-lg font-semibold text-lg hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-200"
          >
          System Admin
          </Link>
        </div>
      </div>
    </div>
  );
}

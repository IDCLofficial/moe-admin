import Link from "next/link";
import { FaUserShield, FaWallet, FaCog } from "react-icons/fa";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Welcome to MOE System 
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Choose your destination
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link 
            href="/admin"
            className="flex flex-col items-center gap-4 px-12 py-8 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-200"
          >
            <FaUserShield className="text-6xl" />
            <span>Admin Dashboard</span>
          </Link>
          
          <Link 
            href="/wallet"
            className="flex flex-col items-center gap-4 px-12 py-8 bg-emerald-600 text-white rounded-lg font-semibold text-lg hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-200"
          >
            <FaWallet className="text-6xl" />
            <span>Wallet</span>
          </Link>
          
          <Link 
            href="/system-admin"
            className="flex flex-col items-center gap-4 px-12 py-8 bg-purple-600 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-200"
          >
            <FaCog className="text-6xl" />
            <span>System Admin</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

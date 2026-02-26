"use client";

interface DashboardFooterProps {
  className?: string;
}

export default function DashboardFooter({ className = "" }: DashboardFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-gray-50 border-t border-gray-200 mt-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            {/* Left side - Copyright */}
            <div className="text-sm text-gray-600">
              © {currentYear} Imo State Ministry of Primary and Secondary Education
            </div>

            {/* Center - Quick Links */}
            <div className="flex items-center space-x-4">
              <a
                href="/admin/help"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Help
              </a>
              <span className="text-gray-300">•</span>
              <a
                href="/admin/support"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Support
              </a>
              <span className="text-gray-300">•</span>
              <a
                href="/admin/docs"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Documentation
              </a>
            </div>

            {/* Right side - Status */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Online</span>
              </div>
              <span className="text-xs text-gray-400">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

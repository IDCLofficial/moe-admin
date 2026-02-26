"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Left side - Copyright */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                © {currentYear} Ministry of Primary Education. All rights reserved.
              </div>
            </div>

            {/* Center - Links */}
            <div className="flex items-center space-x-6">
              <a
                href="/admin/help"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Help & Support
              </a>
              <a
                href="/admin/privacy"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/admin/terms"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Terms of Service
              </a>
            </div>

            {/* Right side - Version & Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">System Online</span>
              </div>
              <div className="text-sm text-gray-500">
                v1.0.0
              </div>
            </div>
          </div>

          {/* Bottom section - Additional info */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
              <div className="text-xs text-gray-500">
                Powered by Ministry of Primary Education Digital Platform
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>Last updated: {new Date().toLocaleDateString()}</span>
                <span>•</span>
                <span>Server: Nigeria</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

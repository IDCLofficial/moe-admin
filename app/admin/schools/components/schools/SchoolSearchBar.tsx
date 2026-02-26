import { useEffect, useRef } from 'react';
import { useSchoolSearch } from '@/hooks/useSchoolSearch';
import SchoolSearchDropdown from './SchoolSearchDropdown';

interface SchoolSearchBarProps {
  placeholder?: string;
  className?: string;
}

export default function SchoolSearchBar({ 
  placeholder = "Search schools by name, principal, or address...",
  className = "w-full pl-10 pr-4 py-2 my-4 mb-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
}: SchoolSearchBarProps) {
  const {
    searchQuery,
    filteredSchools,
    isDropdownOpen,
    isLoading,
    handleSearchChange,
    clearSearch,
    closeDropdown,
    setIsDropdownOpen
  } = useSchoolSearch();

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeDropdown]);

  // Show dropdown when there are results and input is focused
  const handleInputFocus = () => {
    if (searchQuery.length >= 2 && filteredSchools.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  const handleSchoolSelect = () => {
    // Clear the search after selection
    clearSearch();
  };

  return (
    <div ref={containerRef} className="flex-1 max-w-md relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
        onFocus={handleInputFocus}
        className={className}
      />
      {searchQuery && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            onClick={clearSearch}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      <SchoolSearchDropdown
        schools={filteredSchools}
        isOpen={isDropdownOpen}
        isLoading={isLoading}
        onClose={closeDropdown}
        onSchoolSelect={handleSchoolSelect}
      />
    </div>
  );
}

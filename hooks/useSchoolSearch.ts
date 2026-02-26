import { useState, useMemo } from 'react';
import { useGetSchoolNamesQuery } from '@/app/admin/schools/store/api/schoolsApi';
import { School } from '@/services/schoolService';

export const useSchoolSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch all school names
  const { data: schools = [], isLoading } = useGetSchoolNamesQuery();

  // Filter schools based on search query
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    return schools.filter((school: School) =>
      school.schoolName?.toLowerCase().includes(query)
    ).slice(0, 10); // Limit to 10 results
  }, [schools, searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsDropdownOpen(value.length >= 2 && filteredSchools.length > 0);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return {
    searchQuery,
    filteredSchools,
    isDropdownOpen,
    isLoading,
    handleSearchChange,
    clearSearch,
    closeDropdown,
    setIsDropdownOpen
  };
};

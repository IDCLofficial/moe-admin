import { useState, useEffect, useMemo } from 'react'
import { School, Student } from '@/services/schoolService'
import { fetchAllSchools, PaginatedResponse} from '@/services/schoolService'
import useSWR from "swr";


export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface UseSchoolsReturn {
  schools: School[]
  loading: boolean
  error: string | null
  pagination: PaginationInfo | null
  refetch: () => Promise<void>
  setPage: (page: number) => void
  setLimit: (limit: number) => void
}

export interface UseSchoolsParams {
  page?: number
  limit?: number
  searchTerm?: string
  activeTab?: string
}
export interface Application {
  _id: string;
  school: {
    _id: string;
    schoolName: string;
    address: string;
    principal: string;
    email: string;
    students: Student[];
    status: string;
    isFirstLogin: boolean;
    totalPoints: number;
    availablePoints: number;
    usedPoints: number;
    __v: number;
    createdAt: string;
    updatedAt: string;
  };
  schoolName: string;
  address: string;
  schoolCode: string;
  principal: string;
  email: string;
  phone: number;
  numberOfStudents: number;
  applicationStatus: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  reviewNotes?: string;
  reviewedAt?: string;
}


/**
 * Custom hook for fetching and managing schools data with pagination
 * Provides loading states, error handling, pagination, and refetch functionality
 */
// hooks/useSchools.ts


export function useSchools(page: number, limit: number, search?: string, status?: string) {
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<School>>(
    ["schools", page, limit, search, status],
    () => fetchAllSchools(page, limit, search, status)
  );

  // Apply client-side filtering if search term exists
  const filteredSchools = useMemo(() => {
    if (!search || !search.trim() || !data?.data) {
      return data?.data || [];
    }

    const searchTerm = search.toLowerCase().trim();
    
    const filtered = data.data.filter((school) =>
      school.schoolName?.toLowerCase().includes(searchTerm) ||
      school.address?.toLowerCase().includes(searchTerm) ||
      school.principal?.toLowerCase().includes(searchTerm) ||
      school.email?.toLowerCase().includes(searchTerm)
    );
  
    return filtered;
  }, [data?.data, search]);

  return {
    schools: filteredSchools,
    pagination: data?.pagination || null,
    isLoading,
    isError: !!error,
    refetch: () => mutate(), // SWR will revalidate
  };
}



/**
 * Hook for fetching a single school by ID
 */
export const useSchool = (schoolId: string | null) => {
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!schoolId) {
      setSchool(null)
      setLoading(false)
      setError(null)
      return
    }

    const fetchSchool = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const { fetchSchoolById } = await import('@/services/schoolService')
        const schoolData = await fetchSchoolById(schoolId)
        setSchool(schoolData)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch school data'
        setError(errorMessage)
        setSchool(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSchool()
  }, [schoolId])

  return {
    school,
    loading,
    error
  }
}

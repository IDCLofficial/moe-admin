import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'                              
import { School, Student } from '@/services/schoolService'
import { decryptApiResponseFrom, isApiResponseDecryptConfigured } from '@/lib/apiResponseFunnel';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL


// Application interface
export interface Application {
  _id: string;
  school?: {
    _id: string;
    schoolName: string;
    address: string;
    principal: string;
    email: string;
    lga?: string;
    phone?: string;
    students: Student[];
    status?: string;
    isFirstLogin: boolean;
    hasAccount: boolean;
    exams?: Array<{
      name: string;
      status: string;
      totalPoints: number;
      availablePoints: number;
      usedPoints: number;
      numberOfStudents: number;
      reviewNotes?: string;
      applicationId?: string;
    }>;
    totalPoints?: number;
    availablePoints?: number;
    usedPoints?: number;
    __v: number;
    createdAt: string;
    updatedAt: string;
    tempPassword?: string;
    tempPasswordExpiry?: string;
    password?: string;
  };
  schoolName: string;
  address: string;
  schoolCode: string;
  principal: string;
  email: string;
  phone: number;
  numberOfStudents: number;
  examType: string;
  applicationStatus: string;
  __v: number;
  reviewNotes?: string;
  reviewedAt?: string;
}

// Types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage?: boolean
    hasPrevPage?: boolean
  }
}

export interface Transaction {
  _id: string
  numberOfStudents: number
  totalAmount: number
  pointsAwarded: number
  paymentStatus: string
  createdAt: string
  paidAt?: string
  reference: string
  amountPerStudent: number
  paymentNotes?: string
  paystackTransactionId?: string
  school: {
    _id: string
    schoolName: string
    email: string
  }
}

export interface UpdateStatusRequest {
  status: 'approved' | 'rejected' | 'completed'
}

export interface ApplicationsResponse {
  data: Application[]
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  admin: {
    _id: string;
    email: string;
    percentage: number;
    isActive: boolean;
    lastLogin: string;
    adminType: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  accessToken: string;
  tokenType: string;
}

// RTK Query API slice
export const schoolsApi = createApi({
  reducerPath: 'schoolsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      headers.set('ngrok-skip-browser-warning', 'true')
      
      // Add auth token if available
      const token = localStorage.getItem('admin_token')
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      
      return headers
    },
  }),
  tagTypes: ['School', 'Application', 'Transaction', 'Student', "Admin"],
  endpoints: (builder) => ({
    // Get all schools with pagination and filters
    getSchools: builder.query<PaginatedResponse<School>, {
      page?: number
      limit?: number
      search?: string
      status?: string
    }>({
      query: ({ page = 1, limit = 10, search, status } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })
        
        if (search?.trim()) params.append('search', search.trim())
        if (status?.trim()) params.append('status', status.trim())
        
        return `schools?${params.toString()}`
      },
      providesTags: ['School'],
    }),

    // Get school by ID
    getSchoolById: builder.query<School, { id: string; examType?: string }>({
      query: ({ id, examType }) => ({
        url: `/applications/${id}?examType=${examType}`,
        method: 'GET',
      }),
      providesTags: (result, error, { id }) => [{ type: 'School', id }],
    }),

    // Get school transactions
    getSchoolTransactions: builder.query<{ data: Transaction[] }, string>({
      query: (schoolId) => `student-payments/school/${schoolId}`,
      providesTags: (result, error, schoolId) => [{ type: 'Transaction', id: schoolId }],
    }),

    // Get all applications
    getApplications: builder.query<{
      data: Application[]
      meta: {
        page: number
        totalPages: number
        total: number
        limit: number
        hasNextPage: boolean
        hasPrevPage: boolean
      }
    }, {
      page?: number
      limit?: number
      status?: 'not_applied' | 'all' | 'pending' | 'approved' | 'rejected' | 'onboarded' | 'completed'
      searchTerm?: string
      examType?: 'UBEGPT' | 'UBETMS' | 'Common-entrance' | 'BECE' | 'BECE-resit' | 'UBEAT' | 'JSCBE' | 'WAEC'
    }>({
      query: ({ page = 1, limit = 20, status, searchTerm, examType } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })
        
        // Add status filter to server-side query
        if (status) {
          params.append('status', status)
        }
        
        // Add search term to server-side query
        if (searchTerm?.trim()) {
          params.append('search', searchTerm.trim())
        }
        
        // Add exam type filter to server-side query
        if (examType) {
          params.append('examType', examType)
        }
        
        return `applications?${params.toString()}`
      },
      transformResponse: (response: { data?: Application[], meta?: { page?: string, totalPages?: string, total?: string, limit?: string, hasNextPage?: boolean, hasPrevPage?: boolean } }) => {
        // Return the full response with data and meta
        
        return {
          data: response.data || [],
          meta: {
            page: parseInt(response.meta?.page || '1') || 1,
            totalPages: parseInt(response.meta?.totalPages || '1') || 1,
            total: parseInt(response.meta?.total || '0') || 0,
            limit: parseInt(response.meta?.limit || '20') || 20,
            hasNextPage: response.meta?.hasNextPage || false,
            hasPrevPage: response.meta?.hasPrevPage || false
          }
        }
      },
      providesTags: ['Application'],
    }),

    // Get applications by school ID
    getApplicationsBySchoolId: builder.query<Application[], { schoolId: string; examType: string }>({
      query: ({ schoolId, examType }) => `applications/${schoolId}?examType=${examType}`,
      transformResponse: (response: Application[] | { data?: Application[] }) => {
        if (Array.isArray(response)) return response
        return response?.data || []
      },
      providesTags: ['Application'],
    }),

    // Get all students
    getAllStudents: builder.query<Student[], void>({
      query: () => 'students',
      providesTags: ['Student'],
    }),

    // Get students by school ID
    getStudentsBySchoolId: builder.query<Student[], string>({
      query: (schoolId) => `students/school/${schoolId}`,
      providesTags: (result, error, schoolId) => [
        { type: 'Student', id: schoolId },
        { type: 'Student', id: 'LIST' }
      ],
    }),

    // Get school names only
    getSchoolNames: builder.query<School[], void>({
      query: () => 'schools/names',
      providesTags: ['School'],
    }),

    // Update application status
    updateApplicationStatus: builder.mutation<unknown, {
      appIds: string | string[]
      status: 'approved' | 'rejected' | 'completed',
      token: string
      examType?: string
      reviewNotes?: string
    }>({
      queryFn: async ({ appIds, status, token, examType, reviewNotes }) => {
        const ids = Array.isArray(appIds) ? appIds : [appIds]
        try {
          const responses = await Promise.all(
            ids.map(async (appId) => {
              const body: { status: string; reviewNotes?: string } = { status };
              if (reviewNotes) {
                body.reviewNotes = reviewNotes;
              }
              
              const response = await fetch(`${BASE_URL}/applications/${appId}/status?examType=${examType}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
              })
              
              if (!response.ok) {
                throw new Error(`Failed to update application ${appId} to ${status}`)
              }
              
              return response.json()
            })
          )
          
          return { data: responses }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      invalidatesTags: (result, error, { appIds }) => {
        const ids = Array.isArray(appIds) ? appIds : [appIds];
        return [
          'Application', 
          'School',
          // Invalidate specific school records that might be affected
          ...ids.map(id => ({ type: 'School' as const, id }))
        ];
      },
    }),

    // Reapprove rejected application
    reapproveApplication: builder.mutation<Application, { applicationId: string; examType?: string }>({
      query: ({ applicationId, examType }) => ({
        url: `applications/revert/${applicationId}${examType ? `?examType=${examType}` : ''}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Application', 'School'],
    }),
// admin login
    adminLogin: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/admin/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: async (response: unknown) => {
        const raw = response as { data?: unknown }
        if (typeof raw?.data !== 'string') return response as LoginResponse
        if (!(await isApiResponseDecryptConfigured())) return response as LoginResponse
        try {
          const transformedResponse = await decryptApiResponseFrom<LoginResponse>(raw as { data: string }, 'data')
       
          return transformedResponse
        } catch (e) {
          console.warn('apiResponseFunnel: decrypt failed, using raw response. Check API_RESPONSE_DECRYPT_SECRET and backend key/salt match.', e)
          return response as LoginResponse
        }
      },
      invalidatesTags: ['Admin'],
    }),
  }),
})

// Export hooks for usage in functional components
export const {
  useGetSchoolsQuery,
  useGetSchoolByIdQuery,
  useGetSchoolTransactionsQuery,
  useGetApplicationsQuery,
  useGetApplicationsBySchoolIdQuery,
  useGetAllStudentsQuery,
  useGetStudentsBySchoolIdQuery,
  useGetSchoolNamesQuery,
  useUpdateApplicationStatusMutation,
  useReapproveApplicationMutation,
  useAdminLoginMutation,
} = schoolsApi;
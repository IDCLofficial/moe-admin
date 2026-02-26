

export interface Student {
  _id: string;
  studentId: string;
  studentName: string;
  gender: string;
  class: string;
  examYear: string;
  paymentStatus: "Paid" | "Pending";
  onboardingStatus: "Onboarded" | "Not Onboarded";
}

export interface School {
  _id: string;
  schoolName: string;
  schoolCode?: string;
  address: string;
  principal: string;
  email: string;
  phone?: string;
  numberOfStudents?: number;
  students: Student[];
  status: string;
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
  totalPoints: number;
  availablePoints: number;
  usedPoints: number;
  __v: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  reviewNotes?: string;
  reviewedAt?: string;
}

export interface ApiResponse<T> {
  data: T
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage?: boolean
    hasPrevPage?: boolean
  }
}

export interface SchoolApiData {
  _id: string
  schoolName?: string
  schoolCode?: string
  name?: string
  address?: string
  principal?: string
  email?: string
  phone?: number | string
  numberOfStudents?: number
  students?: Student[]
  status?: string
  isFirstLogin?: boolean
  hasAccount?: boolean
  exams?: Array<{
    name: string
    status: string
    totalPoints: number
    availablePoints: number
    usedPoints: number
    numberOfStudents: number
    reviewNotes?: string
    applicationId?: string
  }>
  totalPoints?: number
  availablePoints?: number
  usedPoints?: number
  __v?: number
  createdAt?: string
  updatedAt?: string
  reviewNotes?: string
  reviewedAt?: string
}
/**
 * Transform API school data to match our School interface
 */
export const transformSchoolData = (apiSchool: SchoolApiData): School => {

  return {
    _id: apiSchool._id,
    schoolName: apiSchool.schoolName || apiSchool.name || 'N/A',
    schoolCode: apiSchool.schoolCode,
    address: apiSchool.address || 'N/A',
    principal: apiSchool.principal || 'N/A',
    email: apiSchool.email || 'N/A',
    phone: apiSchool.phone ? String(apiSchool.phone) : undefined,
    numberOfStudents: apiSchool.numberOfStudents,
    students: apiSchool.students || [],
    status: apiSchool.status || 'not applied',
    isFirstLogin: apiSchool.isFirstLogin || false,
    hasAccount: apiSchool.hasAccount || false,
    exams: apiSchool.exams,
    totalPoints: apiSchool.totalPoints || 0,
    availablePoints: apiSchool.availablePoints || 0,
    usedPoints: apiSchool.usedPoints || 0,
    __v: apiSchool.__v || 0,
    createdAt: apiSchool.createdAt || new Date().toISOString(),
    updatedAt: apiSchool.updatedAt || new Date().toISOString(),
    reviewNotes: apiSchool.reviewNotes,
    reviewedAt: apiSchool.reviewedAt
  }
}

// Base URL for the API

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

/**
 * Fetch all schools from the API
 * @returns Promise<School[]> - Array of transformed school objects
 * @throws Error if the request fails
 */

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

export async function fetchAllSchools(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string
): Promise<PaginatedResponse<School>> {
  // Build query parameters
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search && search.trim()) {
    params.append("search", search.trim());
  }

  if (status && status.trim()) {
    params.append("status", status.trim());
  }

  // ✅ Attach params to URL
  const url = `${BASE_URL}/schools?${params.toString()}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch schools");
  }

  return res.json();
}



export async function getSchoolNames(): Promise<School[]> {
  const res = await fetch(
    `${BASE_URL}/schools/names`, 
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: "no-store"
    }
  )
  if (!res.ok){
    throw new Error("Failed to fetch school names")
  }
  return res.json()
}

// fetch students
export const getAllStudents = async () => {
  const res = await fetch(
    `${BASE_URL}/students`, 
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: "no-store"
    }
  )
  if (!res.ok){
    throw new Error("Failed to fetch students")
  }
  return res.json()
}

// fetch payments
export const fetchAllPayments = async () => {
  const res = await fetch(`${BASE_URL}/student-payments/all`,
    {
      method: "GET",
      cache: "no-store"
    }

  )
  if (!res.ok){
throw new Error('Failed to fetch students')
  }
  return res.json()
}


/**
 * Fetch a single school by ID
 * @param schoolId - The school ID to fetch
 * @returns Promise<School> - The transformed school object
 * @throws Error if the request fails or school not found
 */
export const fetchSchoolById = async (schoolId: string): Promise<School> => {
  try {
    const response = await fetch(`${BASE_URL}/schools/${schoolId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch school: ${response.status} ${response.statusText}`)
    }

    const data = await response.json();

    const apiResponse: ApiResponse<SchoolApiData> = data
    if (!apiResponse) {
      throw new Error('School not found')
    }

    const returnData = transformSchoolData(data);

    return returnData
  } catch (error) {
    console.error(`Error fetching school ${schoolId}:`, error)
    throw error instanceof Error ? error : new Error('Unknown error occurred while fetching school')
  }
}

// admin login
export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error("Failed to login");
  }

  const data = await res.json();


  if (data.accessToken) {
    localStorage.setItem("admin_token", data.accessToken);
    localStorage.setItem("admin_email", data.admin.email);
    return true;
  }

  return false;
}

// change status
export async function changeApplicationStatus(
  appIds: string | string[],
  status: "approved" | "rejected" | "completed",
  token: string
) {
  const ids = Array.isArray(appIds) ? appIds : [appIds];

  const responses = await Promise.all(
    ids.map(async (appId) => {
      const res = await fetch(
        `${BASE_URL}/applications/${appId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            status: status
          }),
        }
      );
     
      
      if (!res.ok) {
        throw new Error(`Failed to update application ${appId} to ${status}`);
      }

      return res.json();
    })
  );

  return responses;
}

// fetch a school transactions
export const fetchSchoolTransactions = async (schoolId: string) => {
  const res = await fetch(`${BASE_URL}/student-payments/school/${schoolId}`,
    {
      method: "GET",
      cache: "no-store"
    }

  )
  if (!res.ok){
throw new Error('Failed to fetch transactions')
  }
  return res.json()
}

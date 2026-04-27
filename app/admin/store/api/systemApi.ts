import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
// rtk query api slice

export interface School {
  id: string;
  name: string;
  code: string;
}

export interface Application {
  _id: string;
  examType: string;
  schoolName: string;
  address: string;
  schoolCode: string;
  principal: string;
  email: string;
  phone: number;
  numberOfStudents: number;
  applicationStatus: string;
  reviewedAt?: string;
  school: {
    _id: string;
    schoolName: string;
    address: string;
    lga: string;
    email?: string;
    phone?: string;
    principal?: string;
    schoolCode?: string;
  };
}

export interface SchoolApplications {
  school: School;
  applications: Application[];
}

export interface AeeApplicationsResponse {
  aeeId: string;
  examType: string;
  examYear: string;
  totalSchools: number;
  data: SchoolApplications[];
}

interface CreateExamRequest {
  examName: string;
  fee: number;
  lateFee?: number;
}

interface SetScheduleRequest {
  examId: string;
  schedule: {
    startDate: string;
    lateDate?: string;
    endDate: string;
  };
}

export const systemApi = createApi({
  reducerPath: 'systemApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('admin_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Get all exams
    getAllexams: builder.query<unknown, void>({
      query: () => '/exams',
    }),
    // create new exam
    createExam: builder.mutation<unknown, CreateExamRequest>({
      query: (exam) => ({
        url: '/exams/create-new-exam',
        method: 'POST',
        body: exam,
      }),
    }),
    // fetch exam schedules
    examSchedule: builder.query<unknown, void>(
      {
        query: () => '/exams/schedules' 
      }
    ),
    // delete exam
    deleteExam: builder.mutation({
      query: (examId) => ({
        url: `/exams/${examId}`,
        method: 'DELETE',
      }),
    }),
    // set exam fee
    setExamFee: builder.mutation({
      query: ({ examId, fee, lateFee }) => ({
        url: `/exams/${examId}/set-fees`,
        method: 'PATCH',
        body: { fee, lateFee },
      }),
    }),
    // get aee list
    getAeeList: builder.query<unknown, void>({
      query: () => '/aee',
    }),
    // get aee by id
    getAeeById: builder.query<unknown, string>({
      query: (aeeId) => `/aee/${aeeId}`,
    }),
    // edit aee
    patchAee: builder.mutation<unknown, { aeeId: string; data: unknown }>({
      query: ({ aeeId, data }) => ({
        url: `/aee/${aeeId}`,
        method: 'PATCH',
        body: data,
      }),
    }),
    // delete aee
    deleteAee: builder.mutation({
      query: (aeeId) => ({
        url: `/aee/${aeeId}`,
        method: 'DELETE',
      }),
    }),
    // get aee applications (activity logs)
    getAeeOnboardedStudents: builder.query<AeeApplicationsResponse, { id: string; examType?: string; examYear?: string }>({
      query: ({ id, examType, examYear }) => {
        const params = new URLSearchParams();
        if (examType) params.append('examType', examType);
        if (examYear) params.append('examYear', examYear);
        return {
          url: `/aee/${id}/applications`,
          params: params || undefined,
        };
      },
    }),
    // get all transactions
    getTransactions: builder.query<unknown, void>({
      query: () => '/admin/transactions',
    }),
    // set schedule
    setSchedule: builder.mutation<unknown, SetScheduleRequest>({
      query: ({ examId, schedule }) => ({
        url: `/exams/${examId}/set-schedule`,
        method: 'PATCH',
        body: schedule,
      }),
    }),
  }),
});
 
export const { useGetAllexamsQuery, useExamScheduleQuery, useCreateExamMutation, useDeleteExamMutation, useSetExamFeeMutation, useGetAeeListQuery, useGetAeeByIdQuery, useGetAeeOnboardedStudentsQuery, useGetTransactionsQuery, useSetScheduleMutation } = systemApi;

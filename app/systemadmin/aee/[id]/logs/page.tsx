"use client";

import { useParams, useRouter } from "next/navigation";
import { FaArrowLeft, FaSchool, FaClipboardList, FaCalendarAlt } from "react-icons/fa";
import { useGetAeeByIdQuery, useGetAeeOnboardedStudentsQuery } from "@/app/admin/store/api/systemApi";
import type { AeeApplicationsResponse, SchoolApplications, Application } from "@/app/admin/store/api/systemApi";

export default function AeeLogsPage() {
  const params = useParams();
  const router = useRouter();
  const aeeId = params.id as string;

  const { data: aeeData, isLoading: isAeeLoading } = useGetAeeByIdQuery(aeeId);
  const { data: studentsData, isLoading: isStudentsLoading, error } = useGetAeeOnboardedStudentsQuery({ id: aeeId });

  const aee = aeeData as { fullName?: string; email?: string; lga?: string } | undefined;
  const response = studentsData as AeeApplicationsResponse | undefined;

  const schoolGroups = response?.data || [];
  const totalSchools = response?.totalSchools || 0;

  // Flatten all applications for count
  const allApplications = schoolGroups.flatMap((g: SchoolApplications) => g.applications);
  const totalApplications = allApplications.length;
  const totalStudents = allApplications.reduce((sum: number, app: Application) => sum + (app.numberOfStudents || 0), 0);

  const isLoading = isAeeLoading || isStudentsLoading;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: "bg-emerald-100 text-emerald-700",
      pending: "bg-amber-100 text-amber-700",
      rejected: "bg-red-100 text-red-700",
    };
    return styles[status?.toLowerCase()] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/systemadmin/aee")}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-emerald-700"
          >
            <FaArrowLeft />
            Back to AEE Directory
          </button>
          <h1 className="text-2xl font-bold text-gray-900">AEE Activity Logs</h1>
          <p className="mt-1 text-sm text-gray-600">
            School applications processed by {aee?.fullName || "AEE"}
            {aee?.lga && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{aee.lga}</span>}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/50 bg-white p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <FaSchool className="text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Schools</p>
                <p className="text-xl font-bold text-gray-900">{totalSchools}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <FaClipboardList className="text-lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Applications</p>
                <p className="text-xl font-bold text-gray-900">{totalApplications}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <span className="text-sm font-bold">👥</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Students</p>
                <p className="text-xl font-bold text-gray-900">{totalStudents}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Schools & Applications */}
        {isLoading ? (
          <div className="rounded-2xl border border-white/50 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600"></div>
            <p className="text-sm text-gray-600">Loading activity logs...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-white/50 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-red-600">Failed to load activity logs. Please try again.</p>
          </div>
        ) : schoolGroups.length === 0 ? (
          <div className="rounded-2xl border border-white/50 bg-white p-8 text-center shadow-sm">
            <FaSchool className="mx-auto mb-3 text-3xl text-gray-300" />
            <p className="text-sm text-gray-600">No school applications yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schoolGroups.map((group: SchoolApplications) => (
              <div key={group.school.id} className="overflow-hidden rounded-2xl border border-white/50 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.school.name}</h3>
                      <p className="text-sm text-gray-500">Code: {group.school.code}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                      {group.applications.length} app{group.applications.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Exam</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Principal</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Students</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Reviewed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {group.applications.map((app: Application) => (
                        <tr key={app._id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-900">{app.examType}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{app.principal}</div>
                            <div className="text-xs text-gray-400">{app.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900">{app.numberOfStudents}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(app.applicationStatus)}`}>
                              {app.applicationStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaCalendarAlt className="text-xs text-emerald-500" />
                              {formatDate(app.reviewedAt)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

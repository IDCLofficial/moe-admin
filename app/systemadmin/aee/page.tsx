"use client";

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  FaEdit,
  FaEnvelope,
  FaPhoneAlt,
  FaSearch,
  FaShieldAlt,
  FaSyncAlt,
  FaTimes,
  FaTrashAlt,
  FaUserClock,
  FaUserShield,
  FaUsers,
} from 'react-icons/fa';
import { useGetAeeByIdQuery, useGetAeeListQuery } from '@/app/admin/store/api/systemApi';
import { useRouter } from 'next/navigation';

type AeeStatus = 'Active' | 'Inactive' | 'Pending' | 'Suspended' | 'Unknown';
type StatusFilter = 'All' | AeeStatus;
type UnknownRecord = Record<string, unknown>;

interface AeeAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: AeeStatus;
  lga: string;
  createdAt: string;
}

interface AeeFormData {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: AeeStatus;
  lga: string;
}

const emptyFormData: AeeFormData = {
  fullName: '',
  email: '',
  phone: '',
  role: 'AEE',
  status: 'Unknown',
  lga: '',
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getStringFromKeys(record: UnknownRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value.toString();
    }
  }

  return '';
}

function getBooleanFromKeys(record: UnknownRecord, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number' && (value === 0 || value === 1)) {
      return value === 1;
    }

    if (typeof value === 'string') {
      const normalizedValue = value.trim().toLowerCase();

      if (normalizedValue === 'true') {
        return true;
      }

      if (normalizedValue === 'false') {
        return false;
      }
    }
  }

  return undefined;
}

function getDisplayName(record: UnknownRecord): string {
  const directName = getStringFromKeys(record, ['fullName', 'name', 'username', 'userName', 'displayName']);

  if (directName) {
    return directName;
  }

  const firstName = getStringFromKeys(record, ['firstName', 'firstname', 'givenName']);
  const lastName = getStringFromKeys(record, ['lastName', 'lastname', 'surname', 'familyName']);
  const composedName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return composedName;
}

function normalizeStatus(record: UnknownRecord, fallback: AeeStatus = 'Unknown'): AeeStatus {
  const statusValue = getStringFromKeys(record, ['status', 'accountStatus', 'state', 'userStatus']).toLowerCase();

  if (['active', 'approved', 'enabled', 'verified'].includes(statusValue)) {
    return 'Active';
  }

  if (['inactive', 'disabled', 'deactivated', 'archived'].includes(statusValue)) {
    return 'Inactive';
  }

  if (['pending', 'invited', 'awaiting', 'new'].includes(statusValue)) {
    return 'Pending';
  }

  if (['suspended', 'blocked', 'locked'].includes(statusValue)) {
    return 'Suspended';
  }

  const suspendedValue = getBooleanFromKeys(record, ['isSuspended', 'suspended', 'blocked', 'locked']);

  if (suspendedValue === true) {
    return 'Suspended';
  }

  const activeValue = getBooleanFromKeys(record, ['isActive', 'active', 'enabled']);

  if (activeValue === true) {
    return 'Active';
  }

  if (activeValue === false) {
    return 'Inactive';
  }

  return fallback;
}

function normalizeAee(record: UnknownRecord, index: number, fallback?: AeeAccount): AeeAccount {
  return {
    id: getStringFromKeys(record, ['_id', 'id', 'aeeId', 'userId']) || fallback?.id || `aee-${index + 1}`,
    fullName: getDisplayName(record) || fallback?.fullName || `AEE Account ${index + 1}`,
    email: getStringFromKeys(record, ['email', 'emailAddress', 'mail']) || fallback?.email || '',
    phone: getStringFromKeys(record, ['phone', 'phoneNumber', 'mobile', 'telephone']) || fallback?.phone || '',
    role: getStringFromKeys(record, ['role', 'accountType', 'userType']) || fallback?.role || 'AEE',
    status: normalizeStatus(record, fallback?.status ?? 'Unknown'),
    lga: getStringFromKeys(record, ['lga', 'zone', 'location']) || fallback?.lga || '',
    createdAt: getStringFromKeys(record, ['createdAt', 'created_at', 'dateCreated', 'joinedAt']) || fallback?.createdAt || '',
  };
}

function extractAeeRecords(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!isRecord(response)) {
    return [];
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.aees)) {
    return response.aees;
  }

  if (Array.isArray(response.accounts)) {
    return response.accounts;
  }

  if (isRecord(response.data)) {
    const nestedData = response.data;

    if (Array.isArray(nestedData.aees)) {
      return nestedData.aees;
    }

    if (Array.isArray(nestedData.accounts)) {
      return nestedData.accounts;
    }

    if (Array.isArray(nestedData.data)) {
      return nestedData.data;
    }
  }

  return [];
}

function extractAeeList(response: unknown): AeeAccount[] {
  return extractAeeRecords(response).filter(isRecord).map((record, index) => normalizeAee(record, index));
}

function extractSingleAee(response: unknown, fallback: AeeAccount | null): AeeAccount | null {
  if (!response) {
    return fallback;
  }

  if (!isRecord(response)) {
    return fallback;
  }

  if (isRecord(response.data)) {
    return normalizeAee(response.data, 0, fallback ?? undefined);
  }

  if (isRecord(response.aee)) {
    return normalizeAee(response.aee, 0, fallback ?? undefined);
  }

  if (isRecord(response.account)) {
    return normalizeAee(response.account, 0, fallback ?? undefined);
  }

  return normalizeAee(response, 0, fallback ?? undefined);
}

function toFormData(account: AeeAccount): AeeFormData {
  return {
    fullName: account.fullName,
    email: account.email,
    phone: account.phone,
    role: account.role,
    status: account.status,
    lga: account.lga,
  };
}

function formatDate(value: string): string {
  if (!value) {
    return 'Not available';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
  }).format(parsedDate);
}

function getErrorMessage(error: unknown): string {
  if (isRecord(error)) {
    if (typeof error.data === 'string' && error.data.trim()) {
      return error.data;
    }

    if (isRecord(error.data)) {
      const nestedMessage = getStringFromKeys(error.data, ['message', 'error']);

      if (nestedMessage) {
        return nestedMessage;
      }
    }

    const errorMessage = getStringFromKeys(error, ['message', 'error', 'status']);

    if (errorMessage) {
      return errorMessage;
    }
  }

  return 'Unable to load AEE accounts right now. Please try again.';
}

function getInitials(value: string): string {
  const initials = value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || 'AE';
}

function getStatusClasses(status: AeeStatus): string {
  if (status === 'Active') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
  }

  if (status === 'Pending') {
    return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200';
  }

  if (status === 'Inactive') {
    return 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200';
  }

  if (status === 'Suspended') {
    return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200';
  }

  return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200';
}

export default function AeePage() {
  const router = useRouter();
  const { data: aeeListResponse, isLoading, isFetching, isError, error, refetch } = useGetAeeListQuery(undefined);
  const [selectedAeeId, setSelectedAeeId] = useState<string | null>(null);
  const [pendingDeleteAccount, setPendingDeleteAccount] = useState<AeeAccount | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [formData, setFormData] = useState<AeeFormData>(emptyFormData);

  const accounts = useMemo(() => extractAeeList(aeeListResponse), [aeeListResponse]);
  const selectedListAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAeeId) ?? null,
    [accounts, selectedAeeId],
  );

  const {
    data: selectedAeeResponse,
    isFetching: isFetchingSelected,
    refetch: refetchSelectedAccount,
  } = useGetAeeByIdQuery(selectedAeeId ?? '', {
    skip: !selectedAeeId,
  });

  const selectedAccount = useMemo(
    () => extractSingleAee(selectedAeeResponse, selectedListAccount),
    [selectedAeeResponse, selectedListAccount],
  );

  useEffect(() => {
    if (selectedAccount) {
      setFormData(toFormData(selectedAccount));
      return;
    }

    setFormData(emptyFormData);
  }, [selectedAccount]);

  const filteredAccounts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return [...accounts]
      .filter((account) => {
        const matchesStatus = statusFilter === 'All' || account.status === statusFilter;
        const matchesQuery =
          query.length === 0 ||
          account.fullName.toLowerCase().includes(query) ||
          account.email.toLowerCase().includes(query) ||
          account.phone.toLowerCase().includes(query) ||
          account.role.toLowerCase().includes(query) ||
          account.lga.toLowerCase().includes(query);

        return matchesStatus && matchesQuery;
      })
      .sort((firstAccount, secondAccount) => firstAccount.fullName.localeCompare(secondAccount.fullName));
  }, [accounts, searchTerm, statusFilter]);

  const summary = useMemo(
    () => ({
      total: accounts.length,
      active: accounts.filter((account) => account.status === 'Active').length,
      pending: accounts.filter((account) => account.status === 'Pending').length,
      needsReview: accounts.filter((account) => ['Inactive', 'Suspended', 'Unknown'].includes(account.status)).length,
    }),
    [accounts],
  );

  const queryErrorMessage = isError ? getErrorMessage(error) : null;
  const statusOptions: StatusFilter[] = ['All', 'Active', 'Pending', 'Inactive', 'Suspended', 'Unknown'];

  const handleRefresh = async () => {
    await refetch();

    if (selectedAeeId) {
      await refetchSelectedAccount();
    }
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    if (name === 'fullName') {
      setFormData((currentData) => ({ ...currentData, fullName: value }));
      return;
    }

    if (name === 'email') {
      setFormData((currentData) => ({ ...currentData, email: value }));
      return;
    }

    if (name === 'phone') {
      setFormData((currentData) => ({ ...currentData, phone: value }));
      return;
    }

    if (name === 'role') {
      setFormData((currentData) => ({ ...currentData, role: value }));
      return;
    }

    if (name === 'status') {
      setFormData((currentData) => ({ ...currentData, status: value as AeeStatus }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-emerald-700 p-8 text-white shadow-xl shadow-slate-200">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/90 ring-1 ring-inset ring-white/20">
                AEE system accounts
              </span>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Manage AEE accounts from one secure workspace.
                </h1>
                <p className="mt-1 text-sm leading-6 text-slate-200 sm:text-base">
                  Review account coverage, search the live AEE directory, open individual account records, and prepare edit or delete actions from a single table-driven workflow.
                </p>
              </div>
            </div>

          
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Total accounts</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.total}</p>
                <p className="mt-2 text-sm text-slate-500">All AEE records returned by the API</p>
              </div>
              <span className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <FaUsers />
              </span>
            </div>
          </div>
{/* 
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Active accounts</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.active}</p>
                <p className="mt-2 text-sm text-slate-500">Ready for immediate use</p>
              </div>
              <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <FaShieldAlt />
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending setup</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.pending}</p>
                <p className="mt-2 text-sm text-slate-500">Accounts still awaiting completion</p>
              </div>
              <span className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <FaUserClock />
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Needs review</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.needsReview}</p>
                <p className="mt-2 text-sm text-slate-500">Inactive, suspended, or unknown accounts</p>
              </div>
              <span className="rounded-2xl bg-rose-50 p-3 text-rose-700">
                <FaUserShield />
              </span>
            </div>
          </div> */}
        </section>

<section className="">
  {/* LEFT COLUMN */}
  <div className="min-w-0 space-y-6">
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">AEE account directory</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Search, filter, and open any account directly from the live directory returned by `getAeeListQuery`.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="relative block min-w-[240px]">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search by name, email, phone, or role"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === 'All' ? 'All statuses' : option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {queryErrorMessage ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-rose-700">Could not load AEE accounts</h3>
                <p className="mt-1 text-sm text-rose-600">{queryErrorMessage}</p>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Account</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                      <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">Phone</th>
                      <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 xl:table-cell">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">LGA</th>
                      <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">Joined</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {isLoading && accounts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center justify-center gap-4">
                            <span className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
                            <p className="text-sm text-slate-500">Loading AEE accounts...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                          <div className="mx-auto max-w-md space-y-2">
                            <p className="text-lg font-semibold text-slate-900">No AEE accounts match your view</p>
                            <p className="text-sm text-slate-500">
                              Adjust the search term or status filter, then refresh the directory to pull the latest data.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAccounts.map((account) => (
                        <tr
                          key={account.id}
                          className={`transition hover:bg-emerald-50/40 ${
                            selectedAeeId === account.id ? 'bg-emerald-50/60' : 'bg-white'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => setSelectedAeeId(account.id)}
                              className="flex items-center gap-3 text-left"
                            >
                              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                                {getInitials(account.fullName)}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{account.fullName}</p>
                                <p className="text-xs text-slate-500">AEE system account</p>
                              </div>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{account.email || 'No email address'}</td>
                          <td className="hidden px-6 py-4 text-sm text-slate-600 lg:table-cell">{account.phone || 'No phone number'}</td>
                          <td className="hidden px-6 py-4 text-sm text-slate-600 xl:table-cell">{account.role}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(account.status)}`}>
                              {account.lga}
                            </span>
                          </td>
                          <td className="hidden px-4 py-4 text-sm text-slate-600 md:table-cell">{formatDate(account.createdAt)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => router.push(`/systemadmin/aee/${account.id}/logs`)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 p-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                              >
                                <FaEdit className="text-xs" />
                                View Logs
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteAccount(account)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                              >
                                <FaTrashAlt className="text-xs" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* <div className="xl:sticky xl:top-24">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <p className="text-sm font-semibold text-emerald-600">
                  {selectedAccount ? 'Edit selected account' : 'Account workspace'}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">AEE account details</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Open a row to inspect richer account details from `getAeeByIdQuery` and prepare account-level updates from one focused workspace.
                </p>
              </div>

              {!selectedAccount ? (
                <div className="space-y-4 p-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                    <FaUserShield className="text-xl" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900">Select an account to manage</h3>
                    <p className="text-sm leading-6 text-slate-500">
                      Choose any row from the table to review detailed account information, stage edits, or open the delete confirmation flow.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 p-6">
                  <div className="flex items-start justify-between gap-4 rounded-3xl bg-slate-50 p-5">
                    <div className="flex items-center gap-4">
                      <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-base font-semibold text-white">
                        {getInitials(selectedAccount.fullName)}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{selectedAccount.fullName}</h3>
                        <p className="text-sm text-slate-500">{selectedAccount.role}</p>
                        <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(selectedAccount.status)}`}>
                          {selectedAccount.status}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedAeeId(null)}
                      className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:bg-white hover:text-slate-700"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
                    This editor is already powered by `getAeeByIdQuery`. Add AEE update and delete mutations in `systemApi.ts` when you want save and remove actions to persist.
                  </div>

                  {isFetchingSelected ? (
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      Refreshing the latest account details...
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
                      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                        <FaEnvelope className="text-slate-400" />
                        <span>{selectedAccount.email || 'Not available'}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</p>
                      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                        <FaPhoneAlt className="text-slate-400" />
                        <span>{selectedAccount.phone || 'Not available'}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">LGA</p>
                      <div className="mt-2 text-sm font-semibold text-slate-900">
                        {selectedAccount.lga || 'Not available'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-slate-700">
                        Full name
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleFormChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                        Email address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700">
                        Phone number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="text"
                        value={formData.phone}
                        onChange={handleFormChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700">
                          Role
                        </label>
                        <input
                          id="role"
                          name="role"
                          type="text"
                          value={formData.role}
                          onChange={handleFormChange}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        />
                      </div>

                      <div>
                        <label htmlFor="status" className="mb-2 block text-sm font-medium text-slate-700">
                          Status
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleFormChange}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        >
                          {statusOptions.filter((option) => option !== 'All').map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Refresh details
                    </button>

                    <button
                      type="button"
                      disabled
                      className="rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
                    >
                      Save changes endpoint pending
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div> */}
        </section>

        {pendingDeleteAccount ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-rose-600">Delete AEE account</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">{pendingDeleteAccount.fullName}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    This confirmation flow is ready in the UI. Permanent removal will be enabled once an AEE delete mutation is exposed in `systemApi.ts`.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPendingDeleteAccount(null)}
                  className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                Delete is intentionally blocked right now because the available RTK endpoints only cover the AEE list and single-account detail queries.
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPendingDeleteAccount(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled
                  className="rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
                >
                  Delete endpoint required
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
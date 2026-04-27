"use client";

import { useMemo, useState } from 'react';
import {
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaPhoneAlt,
  FaReceipt,
  FaSearch,
  FaSyncAlt,
  FaTimesCircle,
  FaWallet,
} from 'react-icons/fa';
import { useGetTransactionsQuery } from '@/app/admin/store/api/systemApi';

type TransactionStatus = 'Successful' | 'Pending' | 'Failed' | 'Refunded' | 'Unknown';
type StatusFilter = 'All' | TransactionStatus;
type UnknownRecord = Record<string, unknown>;

interface RegistrationTransaction {
  id: string;
  reference: string;
  candidateName: string;
  email: string;
  phone: string;
  examName: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentMethod: string;
  channel: string;
  createdAt: string;
  description: string;
}

const statusOptions: StatusFilter[] = ['All', 'Successful', 'Pending', 'Failed', 'Refunded', 'Unknown'];

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

function getNumberFromKeys(record: UnknownRecord, keys: string[]): number {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsedValue = Number(value);

      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  return 0;
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

function getRecordFromKeys(record: UnknownRecord, keys: string[]): UnknownRecord | null {
  for (const key of keys) {
    const value = record[key];

    if (isRecord(value)) {
      return value;
    }
  }

  return null;
}

function composeName(record: UnknownRecord | null): string {
  if (!record) {
    return '';
  }

  const firstName = getStringFromKeys(record, ['firstName', 'firstname', 'givenName']);
  const lastName = getStringFromKeys(record, ['lastName', 'lastname', 'surname', 'familyName']);

  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

function getCandidateProfile(record: UnknownRecord): Pick<RegistrationTransaction, 'candidateName' | 'email' | 'phone'> {
  const registrationRecord = getRecordFromKeys(record, ['registration']);
  const nestedCandidateRecord =
    getRecordFromKeys(record, ['candidate', 'student', 'user', 'payer']) ??
    (registrationRecord ? getRecordFromKeys(registrationRecord, ['candidate', 'student', 'user', 'payer']) : null);
  const schoolRecord = getRecordFromKeys(record, ['school']);

  const candidateName =
    getStringFromKeys(record, ['candidateName', 'studentName', 'fullName', 'name', 'payerName']) ||
    (nestedCandidateRecord
      ? getStringFromKeys(nestedCandidateRecord, ['fullName', 'name', 'displayName', 'username']) || composeName(nestedCandidateRecord)
      : '') ||
    getStringFromKeys(schoolRecord ?? {}, ['schoolName', 'name']) ||
    composeName(record) ||
    'Unknown candidate';

  const profileSource = nestedCandidateRecord ?? registrationRecord ?? schoolRecord;
  const email =
    getStringFromKeys(record, ['email', 'emailAddress', 'candidateEmail', 'payerEmail']) ||
    (profileSource ? getStringFromKeys(profileSource, ['email', 'emailAddress', 'mail']) : '');
  const phone =
    getStringFromKeys(record, ['phone', 'phoneNumber', 'mobile', 'candidatePhone', 'payerPhone']) ||
    (profileSource ? getStringFromKeys(profileSource, ['phone', 'phoneNumber', 'mobile', 'telephone']) : '');

  return {
    candidateName,
    email,
    phone,
  };
}

function getExamName(record: UnknownRecord): string {
  const directExamName = getStringFromKeys(record, ['examType', 'examName', 'examTitle', 'exam', 'title', 'registrationType']);

  if (directExamName) {
    return directExamName;
  }

  const examRecord = getRecordFromKeys(record, ['exam']);

  if (examRecord) {
    return getStringFromKeys(examRecord, ['examName', 'title', 'name', 'code']);
  }

  const registrationRecord = getRecordFromKeys(record, ['registration']);

  if (registrationRecord) {
    return (
      getStringFromKeys(registrationRecord, ['examName', 'title', 'registrationType']) ||
      (getRecordFromKeys(registrationRecord, ['exam'])
        ? getStringFromKeys(getRecordFromKeys(registrationRecord, ['exam']) as UnknownRecord, ['examName', 'title', 'name', 'code'])
        : '')
    );
  }

  return '';
}

function normalizeStatus(record: UnknownRecord): TransactionStatus {
  const statusValue = getStringFromKeys(record, ['status', 'paymentStatus', 'transactionStatus', 'state', 'result']).toLowerCase();

  if (['success', 'successful', 'succeeded', 'completed', 'paid', 'approved'].includes(statusValue)) {
    return 'Successful';
  }

  if (['pending', 'processing', 'initiated', 'queued', 'awaiting'].includes(statusValue)) {
    return 'Pending';
  }

  if (['failed', 'declined', 'rejected', 'cancelled', 'canceled', 'error'].includes(statusValue)) {
    return 'Failed';
  }

  if (['refunded', 'reversed', 'reversal'].includes(statusValue)) {
    return 'Refunded';
  }

  if (getBooleanFromKeys(record, ['isRefunded', 'refunded']) === true) {
    return 'Refunded';
  }

  if (getBooleanFromKeys(record, ['failed', 'isFailed']) === true) {
    return 'Failed';
  }

  if (getBooleanFromKeys(record, ['pending', 'isPending']) === true) {
    return 'Pending';
  }

  if (getBooleanFromKeys(record, ['paid', 'isPaid', 'successful', 'isSuccessful', 'completed']) === true) {
    return 'Successful';
  }

  return 'Unknown';
}

function normalizeTransaction(record: UnknownRecord, index: number): RegistrationTransaction {
  const paymentRecord = getRecordFromKeys(record, ['payment', 'transaction']);
  const paystackRecord = getRecordFromKeys(record, ['paystackResponse']);
  const paystackMetadata = paystackRecord ? getRecordFromKeys(paystackRecord, ['metadata']) : null;
  const candidateProfile = getCandidateProfile(record);
  const examName = getExamName(record);
  const reference =
    getStringFromKeys(record, ['reference', 'transactionReference', 'paymentReference', 'tx_ref', 'orderId']) ||
    (paymentRecord ? getStringFromKeys(paymentRecord, ['reference', 'transactionReference', 'paymentReference', 'tx_ref', 'orderId']) : '');

  const currency =
    getStringFromKeys(record, ['currency', 'currencyCode']) ||
    (paystackRecord ? getStringFromKeys(paystackRecord, ['currency']) : '') ||
    (paymentRecord ? getStringFromKeys(paymentRecord, ['currency', 'currencyCode']) : '');

  const amount =
    getNumberFromKeys(record, ['totalAmount', 'amountPerStudent', 'amount', 'fee', 'paidAmount', 'total', 'value']) ||
    (paystackRecord ? getNumberFromKeys(paystackRecord, ['amount']) : 0) ||
    (paymentRecord ? getNumberFromKeys(paymentRecord, ['amount', 'fee', 'paidAmount', 'total', 'value']) : 0);

  const paymentMethod =
    getStringFromKeys(record, ['paymentMethod', 'method', 'provider']) ||
    (paystackRecord ? getStringFromKeys(paystackRecord, ['channel']) : '') ||
    (paymentRecord ? getStringFromKeys(paymentRecord, ['paymentMethod', 'method', 'provider']) : '') ||
    'Not specified';

  const channel =
    getStringFromKeys(record, ['channel', 'paymentChannel']) ||
    (paystackRecord ? getStringFromKeys(paystackRecord, ['channel']) : '') ||
    (paymentRecord ? getStringFromKeys(paymentRecord, ['channel', 'paymentChannel']) : '') ||
    'Not specified';

  const createdAt =
    getStringFromKeys(record, ['createdAt', 'paymentDate', 'transactionDate', 'date', 'created_at', 'updatedAt']) ||
    getStringFromKeys(record, ['paidAt']) ||
    (paystackRecord ? getStringFromKeys(paystackRecord, ['paidAt', 'createdAt', 'transaction_date']) : '') ||
    (paymentRecord ? getStringFromKeys(paymentRecord, ['createdAt', 'paymentDate', 'transactionDate', 'date', 'created_at']) : '');

  const description =
    getStringFromKeys(record, ['description', 'narration', 'note', 'remarks']) ||
    (paystackMetadata ? getStringFromKeys(paystackMetadata, ['notes']) : '') ||
    (paymentRecord ? getStringFromKeys(paymentRecord, ['description', 'narration', 'note', 'remarks']) : '');

  return {
    id: getStringFromKeys(record, ['_id', 'id', 'transactionId']) || reference || `transaction-${index + 1}`,
    reference: reference || `TRX-${index + 1}`,
    candidateName: candidateProfile.candidateName,
    email: candidateProfile.email,
    phone: candidateProfile.phone,
    examName: examName || 'Registration payment',
    amount,
    currency,
    status: normalizeStatus(record),
    paymentMethod,
    channel,
    createdAt,
    description,
  };
}

function extractTransactionRecords(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!isRecord(response)) {
    return [];
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.transactions)) {
    return response.transactions;
  }

  if (Array.isArray(response.results)) {
    return response.results;
  }

  if (isRecord(response.data)) {
    const nestedData = response.data;

    if (Array.isArray(nestedData.transactions)) {
      return nestedData.transactions;
    }

    if (Array.isArray(nestedData.results)) {
      return nestedData.results;
    }

    if (Array.isArray(nestedData.data)) {
      return nestedData.data;
    }
  }

  return [];
}

function getApiSummary(response: unknown): {
  totalTransactions?: number;
  totalRevenue?: number;
  successful?: number;
  pending?: number;
  failed?: number;
  cancelled?: number;
} | null {
  if (!isRecord(response)) {
    return null;
  }

  const apiSummary =
    getRecordFromKeys(response, ['summary']) ||
    (isRecord(response.data) ? getRecordFromKeys(response.data as UnknownRecord, ['summary']) : null);

  if (!apiSummary) {
    return null;
  }

  return {
    totalTransactions: getNumberFromKeys(apiSummary, ['totalTransactions', 'total']),
    totalRevenue: getNumberFromKeys(apiSummary, ['totalRevenue', 'revenue', 'collected']),
    successful: getNumberFromKeys(apiSummary, ['successful']),
    pending: getNumberFromKeys(apiSummary, ['pending']),
    failed: getNumberFromKeys(apiSummary, ['failed']),
    cancelled: getNumberFromKeys(apiSummary, ['cancelled']),
  };
}

function extractTransactions(response: unknown): RegistrationTransaction[] {
  return extractTransactionRecords(response)
    .filter(isRecord)
    .map((record, index) => normalizeTransaction(record, index));
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

  return 'Unable to load registration transactions right now. Please try again.';
}

function parseDateValue(value: string): number {
  if (!value) {
    return 0;
  }

  const parsedDate = new Date(value).getTime();
  return Number.isNaN(parsedDate) ? 0 : parsedDate;
}

function formatDateTime(value: string): string {
  if (!value) {
    return 'Not available';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

function formatAmount(amount: number, currency: string): string {
  const normalizedCurrency = currency.trim().toUpperCase();

  if (normalizedCurrency.length === 3) {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: normalizedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${normalizedCurrency} ${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)}`;
    }
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getStatusClasses(status: TransactionStatus): string {
  if (status === 'Successful') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
  }

  if (status === 'Pending') {
    return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200';
  }

  if (status === 'Failed') {
    return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200';
  }

  if (status === 'Refunded') {
    return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200';
  }

  return 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200';
}

function getStatusDescription(status: TransactionStatus): string {
  if (status === 'Successful') {
    return 'This payment completed successfully and can be counted toward registration revenue.';
  }

  if (status === 'Pending') {
    return 'This payment is still awaiting confirmation from the payment flow or backend reconciliation.';
  }

  if (status === 'Failed') {
    return 'This payment did not complete and may need follow-up with the candidate or provider.';
  }

  if (status === 'Refunded') {
    return 'This payment was reversed or refunded and should not be treated as active collected revenue.';
  }

  return 'The backend did not provide a clearly mapped payment status for this transaction.';
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  if (status === 'Successful') {
    return (
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(status)}`}>
        <FaCheckCircle className="text-[11px]" />
        {status}
      </span>
    );
  }

  if (status === 'Pending') {
    return (
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(status)}`}>
        <FaClock className="text-[11px]" />
        {status}
      </span>
    );
  }

  if (status === 'Failed') {
    return (
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(status)}`}>
        <FaTimesCircle className="text-[11px]" />
        {status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(status)}`}>
      <FaExclamationTriangle className="text-[11px]" />
      {status}
    </span>
  );
}

export default function WalletPage() {
  const { data: transactionsResponse, isLoading, isFetching, isError, error, refetch } = useGetTransactionsQuery(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const transactions = useMemo(() => extractTransactions(transactionsResponse), [transactionsResponse]);
  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return [...transactions]
      .filter((transaction) => {
        const matchesStatus = statusFilter === 'All' || transaction.status === statusFilter;
        const matchesQuery =
          query.length === 0 ||
          transaction.reference.toLowerCase().includes(query) ||
          transaction.candidateName.toLowerCase().includes(query) ||
          transaction.email.toLowerCase().includes(query) ||
          transaction.examName.toLowerCase().includes(query) ||
          transaction.paymentMethod.toLowerCase().includes(query) ||
          transaction.channel.toLowerCase().includes(query);

        return matchesStatus && matchesQuery;
      })
      .sort((firstTransaction, secondTransaction) => parseDateValue(secondTransaction.createdAt) - parseDateValue(firstTransaction.createdAt));
  }, [transactions, searchTerm, statusFilter]);

  const resolvedSelectedTransactionId = useMemo(() => {
    if (selectedTransactionId && filteredTransactions.some((transaction) => transaction.id === selectedTransactionId)) {
      return selectedTransactionId;
    }

    return filteredTransactions[0]?.id ?? null;
  }, [filteredTransactions, selectedTransactionId]);

  const selectedTransaction = useMemo(
    () => filteredTransactions.find((transaction) => transaction.id === resolvedSelectedTransactionId) ?? null,
    [filteredTransactions, resolvedSelectedTransactionId],
  );

  const summaryCurrency = useMemo(() => {
    const currencies = Array.from(
      new Set(
        transactions
          .filter((transaction) => transaction.status === 'Successful' && transaction.currency.trim())
          .map((transaction) => transaction.currency.trim().toUpperCase()),
      ),
    );

    return currencies.length === 1 ? currencies[0] : '';
  }, [transactions]);

  const apiSummary = useMemo(() => getApiSummary(transactionsResponse), [transactionsResponse]);

  const summary = useMemo(() => {
    if (apiSummary) {
      const failedOrCancelled = (apiSummary.failed ?? 0) + (apiSummary.cancelled ?? 0);

      return {
        total: apiSummary.totalTransactions ?? transactions.length,
        successful: apiSummary.successful ?? transactions.filter((transaction) => transaction.status === 'Successful').length,
        pending: apiSummary.pending ?? transactions.filter((transaction) => transaction.status === 'Pending').length,
        failedOrRefunded: failedOrCancelled ||
          transactions.filter((transaction) => ['Failed', 'Refunded', 'Unknown'].includes(transaction.status)).length,
        collected: apiSummary.totalRevenue ?? transactions
          .filter((transaction) => transaction.status === 'Successful')
          .reduce((runningTotal, transaction) => runningTotal + transaction.amount, 0),
      };
    }

    return {
      total: transactions.length,
      successful: transactions.filter((transaction) => transaction.status === 'Successful').length,
      pending: transactions.filter((transaction) => transaction.status === 'Pending').length,
      failedOrRefunded: transactions.filter((transaction) => ['Failed', 'Refunded', 'Unknown'].includes(transaction.status)).length,
      collected: transactions
        .filter((transaction) => transaction.status === 'Successful')
        .reduce((runningTotal, transaction) => runningTotal + transaction.amount, 0),
    };
  }, [transactions, apiSummary]);

  const queryErrorMessage = isError ? getErrorMessage(error) : null;

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-emerald-700 p-8 text-white shadow-xl shadow-slate-200">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/90 ring-1 ring-inset ring-white/20">
                Registration wallet
              </span>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Track registration transactions in one finance-ready workspace.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  Review payments returned by `getTransactionsQuery`, filter by status, monitor revenue signals, and inspect each registration transaction from a single dashboard.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isFetching}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              <FaSyncAlt className={isFetching ? 'animate-spin text-emerald-600' : 'text-emerald-600'} />
              {isFetching ? 'Refreshing transactions...' : 'Refresh transactions'}
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Total transactions</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.total}</p>
                <p className="mt-2 text-sm text-slate-500">All registration payments returned by the API</p>
              </div>
              <span className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <FaReceipt />
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Successful payments</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.successful}</p>
                <p className="mt-2 text-sm text-slate-500">Confirmed registration payments</p>
              </div>
              <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <FaCheckCircle />
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending payments</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.pending}</p>
                <p className="mt-2 text-sm text-slate-500">Transactions awaiting completion or review</p>
              </div>
              <span className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <FaClock />
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Collected value</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{formatAmount(summary.collected, summaryCurrency)}</p>
                <p className="mt-2 text-sm text-slate-500">Successful transactions only</p>
              </div>
              <span className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <FaWallet />
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-1 xl:min-h-[calc(100vh-16rem)]">
          <div className="space-y-6 min-h-0 overflow-hidden">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Registration transactions</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Search by reference, candidate, exam, or payment method and focus the table on the transactions that matter now.
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
                      placeholder="Search transactions"
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

              <div className="mt-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
                This wallet view is read-only and is driven entirely by the current `getTransactions` endpoint.
              </div>
            </div>

            {queryErrorMessage ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-rose-700">Could not load transactions</h3>
                <p className="mt-1 text-sm text-rose-600">{queryErrorMessage}</p>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Results</p>
                  <p className="text-sm text-slate-500">
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear filters
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Transaction</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate</th>
                      <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">Exam</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                      <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">Date</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {isLoading && transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center justify-center gap-4">
                            <span className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
                            <p className="text-sm text-slate-500">Loading registration transactions...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                          <div className="mx-auto max-w-md space-y-2">
                            <p className="text-lg font-semibold text-slate-900">No transactions match your current view</p>
                            <p className="text-sm text-slate-500">
                              Adjust your search or status filter, then refresh the wallet to load the latest registration payments.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className={`transition hover:bg-emerald-50/40 ${
                            resolvedSelectedTransactionId === transaction.id ? 'bg-emerald-50/60' : 'bg-white'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{transaction.reference}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {transaction.paymentMethod} 
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{transaction.candidateName}</p>
                              <p className="mt-1 text-xs text-slate-500">{transaction.email || 'No email provided'}</p>
                            </div>
                          </td>
                          <td className="hidden px-6 py-4 text-sm text-slate-600 lg:table-cell">{transaction.examName}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                            {formatAmount(transaction.amount, transaction.currency)}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={transaction.status} />
                          </td>
                          <td className="hidden px-6 py-4 text-sm text-slate-600 md:table-cell">{formatDateTime(transaction.createdAt)}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTransactionId(transaction.id);
                                setIsModalOpen(true);
                              }}
                              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {isModalOpen && selectedTransaction ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-600">Transaction workspace</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Payment details</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>

              <div className="space-y-6 p-6 max-h-[78vh] overflow-y-auto">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Reference</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">{selectedTransaction.reference}</h3>
                      <p className="mt-2 text-sm text-slate-500">{selectedTransaction.examName}</p>
                    </div>
                    <StatusBadge status={selectedTransaction.status} />
                  </div>

                  <div className="mt-5 rounded-2xl bg-white px-4 py-4 ring-1 ring-inset ring-slate-200">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Amount</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">
                      {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
                  {getStatusDescription(selectedTransaction.status)}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Payment method</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedTransaction.paymentMethod}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Channel</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedTransaction.channel}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Processed at</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(selectedTransaction.createdAt)}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-5">
                  <h3 className="text-base font-semibold text-slate-900">Candidate information</h3>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{selectedTransaction.candidateName}</p>
                      <p className="text-xs text-slate-500">Registration owner</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
                      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                        <FaEnvelope className="text-slate-400" />
                        <span>{selectedTransaction.email || 'Not available'}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</p>
                      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                        <FaPhoneAlt className="text-slate-400" />
                        <span>{selectedTransaction.phone || 'Not available'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-5">
                  <h3 className="text-base font-semibold text-slate-900">Wallet signals</h3>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pending payments</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.pending}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Needs attention</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.failedOrRefunded}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Description</p>
                      <p className="mt-2 text-sm text-slate-700">
                        {selectedTransaction.description || 'No extra transaction description for this record.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
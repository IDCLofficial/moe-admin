"use client";

import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  FaCalendarAlt,
  FaClock,
  FaLayerGroup,
  FaMoneyBillWave,
  FaPlus,
  FaSearch,
  FaTrashAlt,
} from 'react-icons/fa';
import {
  useCreateExamMutation,
  useDeleteExamMutation,
  useGetAllexamsQuery,
  useSetScheduleMutation,
} from '@/app/admin/store/api/systemApi';

type ExamPhase = 'Upcoming' | 'Open' | 'Late Entry' | 'Closed';
type UnknownRecord = Record<string, unknown>;

interface Exam {
  id: string;
  title: string;
  code: string;
  description: string;
  fee: number;
  lateFee?: number;
  startTime: string;
  lateEntryTime: string;
  closeTime: string;
}

interface ExamFormData {
  title: string;
  code: string;
  description: string;
  fee: string;
  lateFee: string;
  startTime: string;
  lateEntryTime: string;
  closeTime: string;
}

interface ExamTimelineFormData {
  startTime: string;
  lateEntryTime: string;
  closeTime: string;
}

interface FeedbackState {
  kind: 'success' | 'error';
  text: string;
}

interface TimelineValidationState {
  startTime: string[];
  lateEntryTime: string[];
  closeTime: string[];
  all: string[];
}

const MAX_EXAM_DURATION_DAYS = 365;
const MAX_EXAM_DURATION_MS = MAX_EXAM_DURATION_DAYS * 24 * 60 * 60 * 1000;

const emptyFormData: ExamFormData = {
  title: '',
  code: '',
  description: '',
  fee: '',
  lateFee: '',
  startTime: '',
  lateEntryTime: '',
  closeTime: '',
};

const emptyTimelineFormData: ExamTimelineFormData = {
  startTime: '',
  lateEntryTime: '',
  closeTime: '',
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

function getOptionalNumberFromKeys(record: UnknownRecord, keys: string[]): number | undefined {
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

  return undefined;
}

function toLocalDateTimeInputValue(value: Date): string {
  const timezoneOffset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toDateTimeInputValue(value: string): string {
  if (!value) {
    return '';
  }

  const parsedDate = new Date(value);

  if (!Number.isNaN(parsedDate.getTime())) {
    return toLocalDateTimeInputValue(parsedDate);
  }

  if (value.includes('T')) {
    return value.slice(0, 16);
  }

  return '';
}

function toTimelineFormData(exam: Pick<Exam, 'startTime' | 'lateEntryTime' | 'closeTime'>): ExamTimelineFormData {
  return {
    startTime: toDateTimeInputValue(exam.startTime),
    lateEntryTime: toDateTimeInputValue(exam.lateEntryTime),
    closeTime: toDateTimeInputValue(exam.closeTime),
  };
}

function hasCompleteTimeline(formData: ExamTimelineFormData): boolean {
  return Boolean(formData.startTime && formData.closeTime);
}

function parseDateTimeInputValue(value: string): Date | null {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function getEarliestSelectableDateTime(now: Date): Date {
  const minimumDateTime = new Date(now);

  if (minimumDateTime.getSeconds() > 0 || minimumDateTime.getMilliseconds() > 0) {
    minimumDateTime.setMinutes(minimumDateTime.getMinutes() + 1);
  }

  minimumDateTime.setSeconds(0, 0);
  return minimumDateTime;
}

function getMaxExamEndInputValue(startTime: string): string {
  const parsedStartTime = parseDateTimeInputValue(startTime);

  if (!parsedStartTime) {
    return '';
  }

  return toLocalDateTimeInputValue(new Date(parsedStartTime.getTime() + MAX_EXAM_DURATION_MS));
}

function getTimelineValidationState(
  formData: Pick<ExamFormData, 'startTime' | 'lateEntryTime' | 'closeTime'>,
  now: Date,
  options?: { enforceCurrentStartTime?: boolean },
): TimelineValidationState {
  const startTimeErrors: string[] = [];
  const lateEntryTimeErrors: string[] = [];
  const closeTimeErrors: string[] = [];

  const startTime = parseDateTimeInputValue(formData.startTime);
  const lateEntryTime = parseDateTimeInputValue(formData.lateEntryTime);
  const closeTime = parseDateTimeInputValue(formData.closeTime);
  const minimumStartTime = getEarliestSelectableDateTime(now);

  if (options?.enforceCurrentStartTime !== false && startTime && startTime.getTime() < minimumStartTime.getTime()) {
    startTimeErrors.push('Start time cannot be earlier than the current date and time.');
  }

  if (lateEntryTime && !startTime) {
    lateEntryTimeErrors.push('Choose a start time first so late entry can be scheduled after it.');
  }

  if (lateEntryTime && startTime && lateEntryTime.getTime() < startTime.getTime()) {
    lateEntryTimeErrors.push('Late entry time cannot be earlier than the selected start time.');
  }

  if (lateEntryTime && startTime && lateEntryTime.getTime() - startTime.getTime() > MAX_EXAM_DURATION_MS) {
    lateEntryTimeErrors.push(`Late entry time cannot be more than ${MAX_EXAM_DURATION_DAYS} days after the selected start time.`);
  }

  if (closeTime && !startTime) {
    closeTimeErrors.push('Choose a start time first so the close time can come after it.');
  }

  if (closeTime && lateEntryTime && closeTime.getTime() < lateEntryTime.getTime()) {
    closeTimeErrors.push('Close time cannot be earlier than the selected late entry time.');
  }

  if (closeTime && !lateEntryTime && startTime && closeTime.getTime() < startTime.getTime()) {
    closeTimeErrors.push('Close time cannot be earlier than the selected start time.');
  }

  if (closeTime && startTime && closeTime.getTime() - startTime.getTime() > MAX_EXAM_DURATION_MS) {
    closeTimeErrors.push(`Close time cannot be more than ${MAX_EXAM_DURATION_DAYS} days after the selected start time.`);
  }

  const all = Array.from(new Set([...startTimeErrors, ...lateEntryTimeErrors, ...closeTimeErrors]));

  return {
    startTime: startTimeErrors,
    lateEntryTime: lateEntryTimeErrors,
    closeTime: closeTimeErrors,
    all,
  };
}

function normalizeExam(record: UnknownRecord, index: number): Exam {
  const title = getStringFromKeys(record, ['title', 'name', 'examTitle', 'examName']);
  const code = getStringFromKeys(record, ['code', 'examCode']);
  const lateFee = getOptionalNumberFromKeys(record, ['lateFee']);
  const startTime = getStringFromKeys(record, ['startTime', 'startDate', 'registrationStart']);
  const lateEntryTime = getStringFromKeys(record, ['lateEntryTime', 'lateEntryDate', 'lateEntryStart', 'lateDate']);
  const closeTime = getStringFromKeys(record, ['closeTime', 'closeDate', 'registrationClose', 'endTime', 'endDate']);

  return {
    id: getStringFromKeys(record, ['_id', 'id', 'examId']) || `${code || 'exam'}-${index + 1}`,
    title: title || `Exam ${index + 1}`,
    code: code || `EXAM-${index + 1}`,
    description: getStringFromKeys(record, ['description', 'details', 'summary']) || 'No description provided.',
    fee: getNumberFromKeys(record, ['fee', 'registrationFee', 'amount']),
    lateFee,
    startTime,
    lateEntryTime,
    closeTime: closeTime || lateEntryTime || startTime,
  };
}

function extractExamList(response: unknown): Exam[] {
  let records: unknown[] = [];

  if (Array.isArray(response)) {
    records = response;
  } else if (isRecord(response)) {
    if (Array.isArray(response.data)) {
      records = response.data;
    } else if (Array.isArray(response.exams)) {
      records = response.exams;
    } else if (isRecord(response.data)) {
      const nestedData = response.data;

      if (Array.isArray(nestedData.exams)) {
        records = nestedData.exams;
      } else if (Array.isArray(nestedData.data)) {
        records = nestedData.data;
      }
    }
  }

  return records.filter(isRecord).map((record, index) => normalizeExam(record, index));
}

function getErrorMessage(error: unknown): string {
  if (isRecord(error)) {
    if (typeof error.data === 'string' && error.data.trim()) {
      return error.data;
    }

    if (isRecord(error.data)) {
      const dataMessage = getStringFromKeys(error.data, ['message', 'error']);

      if (dataMessage) {
        return dataMessage;
      }
    }

    const errorMessage = getStringFromKeys(error, ['message', 'error', 'status']);

    if (errorMessage) {
      return errorMessage;
    }
  }

  return 'Something went wrong. Please try again.';
}

function getExamPhase(exam: Pick<Exam, 'startTime' | 'lateEntryTime' | 'closeTime'>): ExamPhase {
  const now = Date.now();
  const start = new Date(exam.startTime).getTime();
  const close = new Date(exam.closeTime).getTime();
  const parsedLateEntry = exam.lateEntryTime ? new Date(exam.lateEntryTime).getTime() : close;
  const lateEntry = Number.isNaN(parsedLateEntry) ? close : parsedLateEntry;

  if (Number.isNaN(start) || Number.isNaN(close)) {
    return 'Closed';
  }

  if (now < start) {
    return 'Upcoming';
  }

  if (now < lateEntry) {
    return 'Open';
  }

  if (now < close) {
    return 'Late Entry';
  }

  return 'Closed';
}

function getPhaseClasses(phase: ExamPhase): string {
  if (phase === 'Upcoming') {
    return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200';
  }

  if (phase === 'Open') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
  }

  if (phase === 'Late Entry') {
    return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200';
  }

  return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200';
}

function getPhaseDescription(phase: ExamPhase): string {
  if (phase === 'Upcoming') {
    return 'Registration has not started yet.';
  }

  if (phase === 'Open') {
    return 'Standard registration is currently active.';
  }

  if (phase === 'Late Entry') {
    return 'Late entry registration is active.';
  }

  return 'Registration has been closed.';
}

function isActiveExam(exam: Pick<Exam, 'startTime' | 'lateEntryTime' | 'closeTime'>): boolean {
  const phase = getExamPhase(exam);
  return phase === 'Open' || phase === 'Late Entry';
}

function getSortableStartTimeValue(value: string): number {
  const parsedTime = new Date(value).getTime();
  return Number.isNaN(parsedTime) ? Number.MAX_SAFE_INTEGER : parsedTime;
}

function sortExamsByStartTime(examList: Exam[]): Exam[] {
  return [...examList].sort(
    (firstExam, secondExam) => getSortableStartTimeValue(firstExam.startTime) - getSortableStartTimeValue(secondExam.startTime),
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ExamSettings() {
  const { data: examsResponse, isLoading, isFetching, isError, error, refetch } = useGetAllexamsQuery(undefined);
  const [createExam, { isLoading: isCreating }] = useCreateExamMutation();
  const [deleteExam, { isLoading: isDeleting }] = useDeleteExamMutation();
  const [setSchedule, { isLoading: isSettingSchedule }] = useSetScheduleMutation();

  const rawExams = useMemo(() => extractExamList(examsResponse), [examsResponse]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExamFormData>(emptyFormData);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [timelineFormData, setTimelineFormData] = useState<ExamTimelineFormData>(emptyTimelineFormData);
  const [timelineFeedback, setTimelineFeedback] = useState<FeedbackState | null>(null);
  const [isTimelineEditorOpen, setIsTimelineEditorOpen] = useState(false);
  const [timelineOverrides, setTimelineOverrides] = useState<Record<string, ExamTimelineFormData>>({});

  const exams = useMemo(
    () =>
      rawExams.map((exam) => {
        const timelineOverride = timelineOverrides[exam.id];

        if (!timelineOverride) {
          return exam;
        }

        return {
          ...exam,
          startTime: timelineOverride.startTime,
          lateEntryTime: timelineOverride.lateEntryTime,
          closeTime: timelineOverride.closeTime,
        };
      }),
    [rawExams, timelineOverrides],
  );

  const resolvedSelectedExamId = useMemo(() => {
    if (selectedExamId && exams.some((exam) => exam.id === selectedExamId)) {
      return selectedExamId;
    }

    return exams[0]?.id ?? null;
  }, [exams, selectedExamId]);

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === resolvedSelectedExamId) ?? null,
    [exams, resolvedSelectedExamId],
  );

  const displayFormData = formData;

  const filteredExams = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return sortExamsByStartTime(
      exams.filter((exam) => {
        return (
          query.length === 0 ||
          exam.title.toLowerCase().includes(query) ||
          exam.code.toLowerCase().includes(query) ||
          exam.description.toLowerCase().includes(query)
        );
      }),
    );
  }, [exams, searchTerm]);

  const selectedExamInFilteredList = useMemo(
    () => filteredExams.find((exam) => exam.id === resolvedSelectedExamId) ?? filteredExams[0] ?? null,
    [filteredExams, resolvedSelectedExamId],
  );
  const selectedExamPreviewPhase = selectedExamInFilteredList ? getExamPhase(selectedExamInFilteredList) : null;
  const selectedExamHasTimeline = selectedExamInFilteredList ? hasCompleteTimeline(toTimelineFormData(selectedExamInFilteredList)) : false;
  const selectedTimelineActionLabel = selectedExamHasTimeline ? 'Edit time' : 'Create time';
  const selectedTimelineMaximumTime = timelineFormData.startTime ? getMaxExamEndInputValue(timelineFormData.startTime) : '';
  const selectedTimelineMinimumLateEntryTime = timelineFormData.startTime || undefined;
  const selectedTimelineMinimumCloseTime = timelineFormData.lateEntryTime || timelineFormData.startTime || undefined;
  const selectedTimelinePreviewPhase = hasCompleteTimeline(timelineFormData)
    ? getExamPhase({
        startTime: timelineFormData.startTime,
        lateEntryTime: timelineFormData.lateEntryTime,
        closeTime: timelineFormData.closeTime,
      })
    : null;
  const selectedTimelineValidation = getTimelineValidationState(timelineFormData, new Date(), {
    enforceCurrentStartTime: false,
  });
  const selectedTimelineStartReason =
    selectedTimelineValidation.startTime[0] ??
    'Set when registration should open. Existing exam times can be adjusted from this panel.';
  const selectedTimelineLateEntryReason =
    selectedTimelineValidation.lateEntryTime[0] ??
    (timelineFormData.startTime
      ? `Late entry time is optional. If you set it, it must be the selected start time or later and stay within ${MAX_EXAM_DURATION_DAYS} days of it.`
      : 'Choose a start time first. Late entry time is optional and can be added after it.');
  const selectedTimelineCloseReason =
    selectedTimelineValidation.closeTime[0] ??
    (timelineFormData.lateEntryTime
      ? `Close time must be the selected late entry time or later and no more than ${MAX_EXAM_DURATION_DAYS} days after the start time.`
      : timelineFormData.startTime
        ? `Close time is required. It must be the selected start time or later and stay within ${MAX_EXAM_DURATION_DAYS} days of the start time.`
        : 'Choose a start time first. Close time is required and must follow it in order.');

  const activeExams = useMemo(() => sortExamsByStartTime(exams.filter((exam) => isActiveExam(exam))), [exams]);
  const inactiveExams = useMemo(() => sortExamsByStartTime(exams.filter((exam) => !isActiveExam(exam))), [exams]);

  const summary = useMemo(() => {
    const openCount = exams.filter((exam) => isActiveExam(exam)).length;

    const upcomingCount = exams.filter((exam) => getExamPhase(exam) === 'Upcoming').length;
    const averageFee =
      exams.length > 0
        ? exams.reduce((total, exam) => total + exam.fee, 0) / exams.length
        : 0;

    return {
      total: exams.length,
      open: openCount,
      upcoming: upcomingCount,
      averageFee,
    };
  }, [exams]);

  const queryErrorMessage = isError ? getErrorMessage(error) : null;
  const isBusy = isCreating || isDeleting || isSettingSchedule;
  const isInitialLoading = isLoading && exams.length === 0;

  const handleSelectExam = (exam: Exam) => {
    setSelectedExamId(exam.id);
    setTimelineFormData(toTimelineFormData(exam));
    setTimelineFeedback(null);
    setIsTimelineEditorOpen(false);
    setFeedback(null);
  };

  const handleCreateNew = () => {
    setFormData(emptyFormData);
    setFeedback(null);
    setIsCreateFormOpen(true);
  };

  const handleToggleCreateForm = () => {
    if (isCreateFormOpen) {
      setFeedback(null);
      setIsCreateFormOpen(false);
      return;
    }

    setIsCreateFormOpen(true);
  };

  const handleFocusExam = (exam: Exam) => {
    setSearchTerm('');
    setSelectedExamId(exam.id);
    setTimelineFormData(toTimelineFormData(exam));
    setTimelineFeedback(null);
    setIsTimelineEditorOpen(false);
    setFeedback(null);
  };

  const handleResetForm = () => {
    setFormData(emptyFormData);
    setFeedback(null);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    if (feedback?.kind === 'error') {
      setFeedback(null);
    }
  };

  const handleOpenTimelineEditor = () => {
    if (!selectedExamInFilteredList) {
      return;
    }

    setTimelineFormData(toTimelineFormData(selectedExamInFilteredList));
    setTimelineFeedback(null);
    setIsTimelineEditorOpen(true);
  };

  const handleTimelineInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setTimelineFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    if (timelineFeedback?.kind === 'error') {
      setTimelineFeedback(null);
    }
  };

  const handleCancelTimelineEditor = () => {
    if (selectedExamInFilteredList) {
      setTimelineFormData(toTimelineFormData(selectedExamInFilteredList));
    } else {
      setTimelineFormData(emptyTimelineFormData);
    }

    setTimelineFeedback(null);
    setIsTimelineEditorOpen(false);
  };

  const handleSaveTimeline = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedExamInFilteredList) {
      return;
    }

    if (!hasCompleteTimeline(timelineFormData)) {
      setTimelineFeedback({
        kind: 'error',
        text: 'Set the start time and close time before saving this exam time.',
      });
      return;
    }

    if (selectedTimelineValidation.all.length > 0) {
      setTimelineFeedback({
        kind: 'error',
        text: selectedTimelineValidation.all[0],
      });
      return;
    }

    try {
      await setSchedule({
        examId: selectedExamInFilteredList.id,
        schedule: {
          startDate: timelineFormData.startTime,
          ...(timelineFormData.lateEntryTime ? { lateDate: timelineFormData.lateEntryTime } : {}),
          endDate: timelineFormData.closeTime,
        },
      }).unwrap();

      setTimelineOverrides((currentOverrides) => ({
        ...currentOverrides,
        [selectedExamInFilteredList.id]: timelineFormData,
      }));
      setTimelineFeedback({
        kind: 'success',
        text: 'Exam time saved successfully.',
      });
      setIsTimelineEditorOpen(false);
      await refetch();
    } catch (mutationError) {
      setTimelineFeedback({
        kind: 'error',
        text: getErrorMessage(mutationError),
      });
    }
  };

  const handleRefreshExams = async () => {
    setFeedback(null);
    setTimelineFeedback(null);
    setTimelineOverrides({});
    setIsTimelineEditorOpen(false);
    await refetch();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = displayFormData.title.trim();
    const fee = Number(displayFormData.fee);
    const lateFeeValue = displayFormData.lateFee.trim();
    const lateFee = lateFeeValue.length > 0 ? Number(lateFeeValue) : undefined;

    if (!title) {
      setFeedback({
        kind: 'error',
        text: 'Enter the exam name before saving the exam.',
      });
      return;
    }

    if (!Number.isFinite(fee) || fee < 0) {
      setFeedback({
        kind: 'error',
        text: 'Enter a valid registration fee greater than or equal to zero.',
      });
      return;
    }

    if (
      lateFeeValue.length > 0 &&
      (lateFee === undefined || !Number.isFinite(lateFee) || lateFee < 0)
    ) {
      setFeedback({
        kind: 'error',
        text: 'Enter a valid late fee greater than or equal to zero, or leave it empty.',
      });
      return;
    }

    try {
      await createExam({
        examName: title,
        fee,
        ...(lateFee !== undefined ? { lateFee } : {}),
      }).unwrap();

      setFormData(emptyFormData);
      setSelectedExamId(null);
      setSearchTerm('');
      setIsCreateFormOpen(false);
      setFeedback({
        kind: 'success',
        text: 'New exam created successfully.',
      });
      await refetch();
    } catch (mutationError) {
      setFeedback({
        kind: 'error',
        text: getErrorMessage(mutationError),
      });
    }
  };

  const handleDeleteExam = async (examToDelete?: Exam) => {
    const examRecord = examToDelete ?? selectedExam;

    if (!examRecord) {
      return;
    }

    const shouldDelete = window.confirm(`Delete ${examRecord.title}? This action cannot be undone.`);

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteExam(examRecord.id).unwrap();

      setTimelineOverrides((currentOverrides) => {
        if (!currentOverrides[examRecord.id]) {
          return currentOverrides;
        }

        const nextOverrides = { ...currentOverrides };
        delete nextOverrides[examRecord.id];
        return nextOverrides;
      });

      const remainingExams = sortExamsByStartTime(exams.filter((exam) => exam.id !== examRecord.id));

      if (remainingExams.length > 0) {
        const nextExam = remainingExams[0];
        setSelectedExamId(nextExam.id);
        setTimelineFormData(toTimelineFormData(nextExam));
      } else {
        setSelectedExamId(null);
        setTimelineFormData(emptyTimelineFormData);
      }

      setTimelineFeedback(null);
      setIsTimelineEditorOpen(false);
      setFeedback({
        kind: 'success',
        text: 'Exam deleted successfully.',
      });
      await refetch();
    } catch (mutationError) {
      setFeedback({
        kind: 'error',
        text: getErrorMessage(mutationError),
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-emerald-600">Exam management</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Manage exams in a simpler workflow.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Create new exams, review the full list, and separate active registration windows from inactive ones without the page feeling crowded.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefreshExams}
              disabled={isFetching || isBusy}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {isFetching ? 'Refreshing exams...' : 'Refresh exams'}
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Total exams</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.total}</p>
                <p className="mt-2 text-sm text-slate-500">All configured exams in the system</p>
              </div>
              <span className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <FaLayerGroup />
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Registration active</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.open}</p>
                <p className="mt-2 text-sm text-slate-500">Open or late-entry windows available</p>
              </div>
              <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <FaClock />
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Upcoming</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.upcoming}</p>
                <p className="mt-2 text-sm text-slate-500">Waiting for registration to start</p>
              </div>
              <span className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <FaCalendarAlt />
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Average fee</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{formatAmount(summary.averageFee)}</p>
                <p className="mt-2 text-sm text-slate-500">Average registration fee across exams</p>
              </div>
              <span className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <FaMoneyBillWave />
              </span>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-600">Create a new exam</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">New exam module</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Add the exam details once and create a new exam record without switching panels.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleCreateForm}
                disabled={isBusy}
                aria-expanded={isCreateFormOpen}
                aria-controls="createExamFormPanel"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                <FaPlus className="text-emerald-600" />
                {isCreateFormOpen ? 'Hide create form' : 'Create exam'}
              </button>
            </div>
          </div>

          {feedback ? (
            <div
              className={`mx-6 mt-6 rounded-2xl px-4 py-3 text-sm font-medium ${
                feedback.kind === 'success'
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                  : 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200'
              }`}
            >
              {feedback.text}
            </div>
          ) : null}

          {isCreateFormOpen ? (
            <div id="createExamFormPanel">
              <div className="mx-6 mt-6 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
                The current create endpoint saves only the exam name, fee, and optional late fee. After creating an exam, use the selected exam panel to create or edit its time.
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-700">
                      Exam name
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      disabled={isBusy}
                      value={displayFormData.title}
                      onChange={handleInputChange}
                      placeholder="Enter exam title"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="code" className="mb-2 block text-sm font-medium text-slate-700">
                      Exam code
                    </label>
                    <input
                      id="code"
                      name="code"
                      type="text"
                      disabled={isBusy}
                      value={displayFormData.code}
                      onChange={handleInputChange}
                      placeholder="WAEC"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="fee" className="mb-2 block text-sm font-medium text-slate-700">
                      Registration fee
                    </label>
                    <input
                      id="fee"
                      name="fee"
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={isBusy}
                      value={displayFormData.fee}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="lateFee" className="mb-2 block text-sm font-medium text-slate-700">
                      Late fee
                    </label>
                    <input
                      id="lateFee"
                      name="lateFee"
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={isBusy}
                      value={displayFormData.lateFee}
                      onChange={handleInputChange}
                      placeholder="Optional"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      disabled={isBusy}
                      value={displayFormData.description}
                      onChange={handleInputChange}
                      placeholder="Add a concise description for administrators and operators"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
                  Exam time is handled from the selected exam section. Create the exam here first, then use the selected exam panel to create or edit its registration window.
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    disabled={isBusy}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Clear form
                  </button>

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    <FaPlus />
                    {isCreating ? 'Creating exam...' : 'Create exam'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-600">See all exams</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">All exam records</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Search through every exam, select one to preview, and keep a quick overview of the registration timeline.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block min-w-[260px]">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by exam name, code, or description"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleRefreshExams}
                  disabled={isFetching || isBusy}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {isFetching ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

          {queryErrorMessage ? (
            <div className="mx-6 mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-rose-700">Could not load the latest exams</h3>
                  <p className="mt-1 text-sm text-rose-600">{queryErrorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshExams}
                  disabled={isFetching || isBusy}
                  className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:bg-rose-100 disabled:text-rose-400"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : null}

          {isInitialLoading ? (
            <div className="p-10 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Loading exams</h3>
              <p className="mt-2 text-sm text-slate-500">Fetching exam records from the API.</p>
            </div>
          ) : filteredExams.length > 0 ? (
            <div className="grid gap-6 p-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-3">
                {filteredExams.map((exam) => {
                  const phase = getExamPhase(exam);
                  const isSelected = selectedExamInFilteredList?.id === exam.id;

                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => handleSelectExam(exam)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? 'border-emerald-300 bg-emerald-50/50 ring-2 ring-emerald-100'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-900">{exam.title}</h3>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {exam.code}
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{exam.description}</p>
                        </div>

                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPhaseClasses(phase)}`}>
                          {phase}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Start</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(exam.startTime)}</p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Close</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(exam.closeTime)}</p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Fee</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{formatAmount(exam.fee)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                {selectedExamInFilteredList ? (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-emerald-600">Selected exam</p>
                        <h3 className="mt-1 text-2xl font-semibold text-slate-900">{selectedExamInFilteredList.title}</h3>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                            {selectedExamInFilteredList.code}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPhaseClasses(
                              selectedExamPreviewPhase ?? 'Closed',
                            )}`}
                          >
                            {selectedExamPreviewPhase ?? 'Closed'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteExam(selectedExamInFilteredList)}
                        disabled={isBusy}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-rose-100 disabled:text-rose-300"
                      >
                        <FaTrashAlt />
                        {isDeleting ? 'Deleting...' : 'Delete exam'}
                      </button>
                    </div>

                    <p className="text-sm leading-6 text-slate-600">{selectedExamInFilteredList.description}</p>

                    {timelineFeedback ? (
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                          timelineFeedback.kind === 'success'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                            : 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200'
                        }`}
                      >
                        {timelineFeedback.text}
                      </div>
                    ) : null}

                    <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                      Exam time changes from this panel are saved through the schedule endpoint and refreshed back into the exam list after a successful request.
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-slate-200">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Start time</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(selectedExamInFilteredList.startTime)}</p>
                      </div>

                      <div className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-slate-200">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Late entry time</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(selectedExamInFilteredList.lateEntryTime)}</p>
                      </div>

                      <div className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-slate-200">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Close time</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(selectedExamInFilteredList.closeTime)}</p>
                      </div>

                      <div className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-slate-200">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Fees</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {formatAmount(selectedExamInFilteredList.fee)}
                          {selectedExamInFilteredList.lateFee !== undefined
                            ? ` · Late fee ${formatAmount(selectedExamInFilteredList.lateFee)}`
                            : ' '}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
                      {getPhaseDescription(selectedExamPreviewPhase ?? 'Closed')}
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-emerald-600">Exam time</p>
                          <h4 className="mt-1 text-lg font-semibold text-slate-900">
                            {selectedTimelineActionLabel} for the selected exam
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {selectedExamHasTimeline
                              ? 'Adjust the selected exam time here. If the updated schedule is open or in late entry, the exam will stay or move into the active section.'
                              : 'Create the registration time for this exam here. Once the schedule becomes open or enters late entry, the exam will move into the active section.'}
                          </p>
                        </div>

                        {!isTimelineEditorOpen ? (
                          <button
                            type="button"
                            onClick={handleOpenTimelineEditor}
                            disabled={isBusy}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            <FaClock className="text-emerald-600" />
                            {selectedTimelineActionLabel}
                          </button>
                        ) : null}
                      </div>

                      {isTimelineEditorOpen ? (
                        <form onSubmit={handleSaveTimeline} className="mt-5 space-y-5">
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
                            <p className="font-medium text-slate-900">Time rules</p>
                            <ul className="mt-2 list-disc space-y-1 pl-5">
                              <li>Start time is required.</li>
                              <li>Late entry time is optional, but if you set it, it cannot be earlier than the selected start time.</li>
                              <li>Close time is required and cannot be earlier than the late entry time, or the start time when no late entry time is set.</li>
                              <li>The gap between start time and close time cannot be more than 365 days.</li>
                            </ul>
                          </div>

                          <div className="grid gap-4">
                            <div>
                              <label htmlFor="selectedExamStartTime" className="mb-2 block text-sm font-medium text-slate-700">
                                Start time
                              </label>
                              <input
                                id="selectedExamStartTime"
                                name="startTime"
                                type="datetime-local"
                                disabled={isBusy}
                                value={timelineFormData.startTime}
                                onChange={handleTimelineInputChange}
                                aria-invalid={selectedTimelineValidation.startTime.length > 0}
                                aria-describedby="selectedExamStartTimeReason"
                                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${
                                  selectedTimelineValidation.startTime.length > 0
                                    ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                                    : 'border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'
                                }`}
                              />
                              <p
                                id="selectedExamStartTimeReason"
                                className={`mt-2 text-xs ${selectedTimelineValidation.startTime.length > 0 ? 'text-rose-600' : 'text-slate-500'}`}
                              >
                                {selectedTimelineStartReason}
                              </p>
                            </div>

                            <div>
                              <label htmlFor="selectedExamLateEntryTime" className="mb-2 block text-sm font-medium text-slate-700">
                                Late entry time
                              </label>
                              <input
                                id="selectedExamLateEntryTime"
                                name="lateEntryTime"
                                type="datetime-local"
                                disabled={isBusy}
                                min={selectedTimelineMinimumLateEntryTime}
                                max={selectedTimelineMaximumTime || undefined}
                                value={timelineFormData.lateEntryTime}
                                onChange={handleTimelineInputChange}
                                aria-invalid={selectedTimelineValidation.lateEntryTime.length > 0}
                                aria-describedby="selectedExamLateEntryTimeReason"
                                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${
                                  selectedTimelineValidation.lateEntryTime.length > 0
                                    ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                                    : 'border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'
                                }`}
                              />
                              <p
                                id="selectedExamLateEntryTimeReason"
                                className={`mt-2 text-xs ${selectedTimelineValidation.lateEntryTime.length > 0 ? 'text-rose-600' : 'text-slate-500'}`}
                              >
                                {selectedTimelineLateEntryReason}
                              </p>
                            </div>

                            <div>
                              <label htmlFor="selectedExamCloseTime" className="mb-2 block text-sm font-medium text-slate-700">
                                Close time
                              </label>
                              <input
                                id="selectedExamCloseTime"
                                name="closeTime"
                                type="datetime-local"
                                disabled={isBusy}
                                min={selectedTimelineMinimumCloseTime}
                                max={selectedTimelineMaximumTime || undefined}
                                value={timelineFormData.closeTime}
                                onChange={handleTimelineInputChange}
                                aria-invalid={selectedTimelineValidation.closeTime.length > 0}
                                aria-describedby="selectedExamCloseTimeReason"
                                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${
                                  selectedTimelineValidation.closeTime.length > 0
                                    ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                                    : 'border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'
                                }`}
                              />
                              <p
                                id="selectedExamCloseTimeReason"
                                className={`mt-2 text-xs ${selectedTimelineValidation.closeTime.length > 0 ? 'text-rose-600' : 'text-slate-500'}`}
                              >
                                {selectedTimelineCloseReason}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
                            <p className="font-medium text-slate-900">Expected status after save</p>
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPhaseClasses(
                                  selectedTimelinePreviewPhase ?? 'Closed',
                                )}`}
                              >
                                {selectedTimelinePreviewPhase ?? 'Closed'}
                              </span>
                              <span>{getPhaseDescription(selectedTimelinePreviewPhase ?? 'Closed')}</span>
                            </div>
                          </div>

                          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <button
                              type="button"
                              onClick={handleCancelTimelineEditor}
                              disabled={isBusy}
                              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              Cancel
                            </button>

                            <button
                              type="submit"
                              disabled={isBusy}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                            >
                              <FaClock />
                              {isSettingSchedule
                                ? selectedExamHasTimeline
                                  ? 'Updating exam time...'
                                  : 'Creating exam time...'
                                : selectedExamHasTimeline
                                  ? 'Update exam time'
                                  : 'Create exam time'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
                          {selectedExamHasTimeline
                            ? 'Use Edit time to update the selected exam schedule from this panel.'
                            : 'This exam has no time set yet. Use Create time to add a schedule and move it into the active section when the registration window opens.'}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-500 ring-1 ring-inset ring-slate-200">
                      <FaSearch />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">No exam preview available</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      Select an exam from the list to preview its timeline and fee information here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <FaSearch />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {exams.length === 0 && searchTerm.length === 0 ? 'No exams available yet' : 'No exams match your search'}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {exams.length === 0 && searchTerm.length === 0
                  ? 'Create your first exam or refresh the API response to populate this list.'
                  : 'Clear the search term or create a new exam to continue.'}
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear search
                </button>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={isBusy}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  Create exam
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-600">Active exams</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">{activeExams.length} active registration windows</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Open and late-entry exams that candidates can still register for right now.
                  </p>
                </div>

                <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <FaClock />
                </span>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {activeExams.length > 0 ? (
                activeExams.map((exam) => {
                  const phase = getExamPhase(exam);

                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => handleFocusExam(exam)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        resolvedSelectedExamId === exam.id
                          ? 'border-emerald-300 bg-emerald-50/50 ring-2 ring-emerald-100'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-900">{exam.title}</h3>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {exam.code}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{getPhaseDescription(phase)}</p>
                        </div>

                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPhaseClasses(phase)}`}>
                          {phase}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Start time</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(exam.startTime)}</p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Close time</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(exam.closeTime)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <h3 className="text-lg font-semibold text-slate-900">No active exams</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Open and late-entry registration windows will appear here as soon as they become active.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-blue-600">Inactive exams</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">{inactiveExams.length} inactive exams</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Upcoming and closed exams that are not currently accepting active registrations.
                  </p>
                </div>

                <span className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <FaCalendarAlt />
                </span>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {inactiveExams.length > 0 ? (
                inactiveExams.map((exam) => {
                  const phase = getExamPhase(exam);

                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => handleFocusExam(exam)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        resolvedSelectedExamId === exam.id
                          ? 'border-emerald-300 bg-emerald-50/50 ring-2 ring-emerald-100'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-900">{exam.title}</h3>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {exam.code}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{getPhaseDescription(phase)}</p>
                        </div>

                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPhaseClasses(phase)}`}>
                          {phase}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Start time</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(exam.startTime)}</p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Close time</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(exam.closeTime)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <h3 className="text-lg font-semibold text-slate-900">No inactive exams</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Upcoming and closed exams will appear here whenever they fall outside the active registration window.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

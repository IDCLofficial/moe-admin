'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { FaSearch, FaEdit, FaSave, FaTimes, FaSpinner, FaSignOutAlt, FaUsersCog, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import Swal from 'sweetalert2'
import { usePlaygroundAuth } from '@/contexts/PlaygroundAuthContext'
import NameCorrectionLoginForm from './components/NameCorrectionLoginForm'
import { PlaygroundLog, getPlaygroundLogs } from '@/services/playgroundAuthService'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface Student {
  _id: string
  name: string
  examNo: string
  examYear: number
  examType: string
  school?: string
  lga?: string
  subjects?: Record<string, {
    ca: number
    exam: number
    total: number
    _id: string
  }>
}

interface SearchResponse {
  results: Student[]
  total: number
  page: string
  limit: string
}

type ExamType = 'UBEAT' | 'BECE'

const LOGS_LIMIT = 20

const LOG_COLUMN_ORDER = [
  'examType',
  'examNo',
  'oldName',
  'newName',
  'oldExamNumber',
  'newExamNumber',
  'before',
  'after',
  'performedBy',
  'updatedBy',
]

const HIDDEN_LOG_COLUMNS = new Set([
  '__v',
  '_id',
  'timestamp',
  'action',
  'studentId',
  'createdAt',
  'actorEmail',
  'field',
  'schoolCode',
  'studentName',
])

function formatLogHeader(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}

function formatLogValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    const date = new Date(value)
    if (!isNaN(date.getTime())) return date.toLocaleString()
  }
  if (Array.isArray(value)) return value.map((v) => formatLogValue(v)).join(', ')
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${formatLogHeader(k)}: ${formatLogValue(v)}`)
      .join(', ')
  }
  return String(value)
}

export default function NameCorrectionPage() {
  const { isAuthenticated, isTokenLoaded, isAdmin, user, token, logout } = usePlaygroundAuth()
  const [examType, setExamType] = useState<ExamType>('UBEAT')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  const [logs, setLogs] = useState<PlaygroundLog[]>([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsPage, setLogsPage] = useState(1)
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState<string | null>(null)

  const loadLogs = useCallback(async () => {
    if (!token) return
    setLogsLoading(true)
    setLogsError(null)
    try {
      const data = await getPlaygroundLogs(token, logsPage, LOGS_LIMIT)
      setLogs(data.logs || [])
      setLogsTotal(data.total || 0)
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : 'Failed to load logs')
    } finally {
      setLogsLoading(false)
    }
  }, [token, logsPage])

  useEffect(() => {
    if (token) {
      loadLogs()
    }
  }, [token, loadLogs])

  const logColumns = useMemo(() => {
    const keys = new Set<string>()
    logs.forEach((log) => {
      Object.keys(log).forEach((key) => {
        if (!HIDDEN_LOG_COLUMNS.has(key)) keys.add(key)
      })
    })
    const ordered = LOG_COLUMN_ORDER.filter((key) => keys.has(key))
    const rest = Array.from(keys)
      .filter((key) => !ordered.includes(key))
      .sort()
    return [...ordered, ...rest]
  }, [logs])

  const logsTotalPages = Math.max(1, Math.ceil(logsTotal / LOGS_LIMIT))

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Search',
        text: 'Please enter an exam number to search.',
      })
      return
    }

    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const params = new URLSearchParams({
        examType,
        query: query.trim(),
        page: '1',
        limit: '20',
      })

      const res = await fetch(`${BASE_URL}/results-playground/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      })

      if (!res.ok) {
        throw new Error(`Search failed: ${res.status} ${res.statusText}`)
      }

      const data: SearchResponse = await res.json()
      setResults(data.results || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search students'
      setError(message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [examType, query, token])

  const handleEdit = (student: Student) => {
    setEditingId(student._id)
    setEditName(student.name)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleSave = async (student: Student) => {
    if (!editName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Name',
        text: 'Student name cannot be empty.',
      })
      return
    }

    setSaving(true)

    try {
      const endpoint = `/results-playground/update-name`

      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          examType,
          studentId: student._id,
          newName: editName.trim(),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.message || `Update failed: ${res.status}`)
      }

      Swal.fire({
        icon: 'success',
        title: 'Name Updated',
        text: `Student name has been updated to "${editName.trim()}".`,
        timer: 3000,
        showConfirmButton: false,
      })

      setResults((prev) =>
        prev.map((s) =>
          s._id === student._id
            ? { ...s, name: editName.trim() }
            : s
        )
      )

      setEditingId(null)
      setEditName('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update student name'
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: message,
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isTokenLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <NameCorrectionLoginForm />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-700 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Student Name Correction</h1>
            <p className="text-green-100 text-sm mt-1">
              Search for a student by exam number and correct their name.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-green-100">
                {user.name} <span className="opacity-70">({user.role})</span>
              </span>
            )}
            {isAdmin && (
              <Link
                href="/name-correction/users"
                className="flex items-center gap-2 text-sm bg-green-800 hover:bg-green-900 px-3 py-2 rounded-lg transition-colors"
              >
                <FaUsersCog />
                Manage Users
              </Link>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm bg-green-800 hover:bg-green-900 px-3 py-2 rounded-lg transition-colors"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Exam Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Type
              </label>
              <select
                value={examType}
                onChange={(e) => {
                  setExamType(e.target.value as ExamType)
                  setResults([])
                  setHasSearched(false)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
              >
                <option value="UBEAT">UBEAT</option>
                <option value="BECE">BECE</option>
              </select>
            </div>

            {/* Exam Number Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Number
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-900" />
                  <input
                    type="text"
                    placeholder="e.g. oM/065/4832"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch()
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <FaSearch />
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Results */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">
                  No students found for &quot;{query}&quot; in {examType}.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        School
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((student) => {
                      const isEditing = editingId === student._id

                      return (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.examNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                autoFocus
                              />
                            ) : (
                              student.name
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.examYear}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.school || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {isEditing ? (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleSave(student)}
                                  disabled={saving}
                                  className="text-green-600 hover:text-green-900 flex items-center gap-1 disabled:opacity-50"
                                >
                                  {saving ? (
                                    <FaSpinner className="animate-spin" />
                                  ) : (
                                    <FaSave />
                                  )}
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={saving}
                                  className="text-red-600 hover:text-red-900 flex items-center gap-1 disabled:opacity-50"
                                >
                                  <FaTimes />
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEdit(student)}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1"
                              >
                                <FaEdit />
                                Edit Name
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Change Logs */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Logs</h2>

          {logsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{logsError}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {logsLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No logs found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {logColumns.map((col) => (
                        <th
                          key={col}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {formatLogHeader(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        {logColumns.map((col) => (
                          <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatLogValue(log[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!logsLoading && logs.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Page {logsPage} of {logsTotalPages} &middot; {logsTotal} total {logsTotal === 1 ? 'entry' : 'entries'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                  disabled={logsPage <= 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronLeft />
                  Prev
                </button>
                <button
                  onClick={() => setLogsPage((p) => Math.min(logsTotalPages, p + 1))}
                  disabled={logsPage >= logsTotalPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

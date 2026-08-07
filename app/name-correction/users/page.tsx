'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Swal from 'sweetalert2'
import { FaArrowLeft, FaSpinner, FaUserPlus, FaLock, FaLockOpen, FaTrash } from 'react-icons/fa'
import { usePlaygroundAuth } from '@/contexts/PlaygroundAuthContext'
import NameCorrectionLoginForm from '../components/NameCorrectionLoginForm'
import {
  PlaygroundUser,
  PlaygroundRole,
  listPlaygroundUsers,
  createPlaygroundUser,
  blockPlaygroundUser,
  unblockPlaygroundUser,
  deletePlaygroundUser,
} from '@/services/playgroundAuthService'

const emptyForm = { name: '', email: '', password: '', role: 'regular' as PlaygroundRole }

export default function NameCorrectionUsersPage() {
  const { isAuthenticated, isTokenLoaded, isAdmin, user, token } = usePlaygroundAuth()

  const [users, setUsers] = useState<PlaygroundUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    if (!token) return
    setLoadingUsers(true)
    setError(null)
    try {
      const data = await listPlaygroundUsers(token)
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }, [token])

  useEffect(() => {
    if (isAdmin && token) {
      loadUsers()
    }
  }, [isAdmin, token, loadUsers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      Swal.fire({ icon: 'warning', title: 'Missing Fields', text: 'Name, email and password are required.' })
      return
    }

    setCreating(true)
    try {
      const newUser = await createPlaygroundUser(token, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      })
      setUsers((prev) => [...prev, newUser])
      setFormData(emptyForm)
      Swal.fire({
        icon: 'success',
        title: 'User Created',
        text: `${newUser.name} has been added.`,
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user'
      Swal.fire({ icon: 'error', title: 'Create Failed', text: message })
    } finally {
      setCreating(false)
    }
  }

  const handleToggleBlock = async (target: PlaygroundUser) => {
    if (!token) return
    setActionId(target._id)
    try {
      if (target.isBlocked) {
        await unblockPlaygroundUser(token, target._id)
      } else {
        await blockPlaygroundUser(token, target._id)
      }
      setUsers((prev) =>
        prev.map((u) => (u._id === target._id ? { ...u, isBlocked: !target.isBlocked } : u))
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action failed'
      Swal.fire({ icon: 'error', title: 'Error', text: message })
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (target: PlaygroundUser) => {
    if (!token) return

    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Delete User',
      text: `Are you sure you want to delete ${target.name}? This cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
    })
    if (!confirm.isConfirmed) return

    setActionId(target._id)
    try {
      await deletePlaygroundUser(token, target._id)
      setUsers((prev) => prev.filter((u) => u._id !== target._id))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user'
      Swal.fire({ icon: 'error', title: 'Delete Failed', text: message })
    } finally {
      setActionId(null)
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <p className="text-gray-700 text-lg font-medium mb-2">Access Denied</p>
          <p className="text-gray-500 mb-6">You need admin access to manage users.</p>
          <Link href="/name-correction" className="text-green-600 hover:underline">
            Back to Name Correction
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link href="/name-correction" className="inline-flex items-center gap-2 text-green-100 hover:text-white text-sm mb-2">
            <FaArrowLeft />
            Back to Name Correction
          </Link>
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <p className="text-green-100 text-sm mt-1">
            Create and manage accounts that can access the Name Correction portal.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Create User Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                placeholder="Password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as PlaygroundRole }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
              >
                <option value="regular">Regular</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="md:col-span-4">
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating ? <FaSpinner className="animate-spin" /> : <FaUserPlus />}
                Create User
              </button>
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loadingUsers ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => {
                    const isSelf = u._id === user?._id
                    const busy = actionId === u._id
                    return (
                      <tr key={u._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{u.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              u.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {u.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleToggleBlock(u)}
                              disabled={busy}
                              className="text-yellow-600 hover:text-yellow-900 flex items-center gap-1 disabled:opacity-50"
                            >
                              {busy ? <FaSpinner className="animate-spin" /> : u.isBlocked ? <FaLockOpen /> : <FaLock />}
                              {u.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                            <button
                              onClick={() => handleDelete(u)}
                              disabled={busy || isSelf}
                              title={isSelf ? 'You cannot delete your own account' : undefined}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FaTrash />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

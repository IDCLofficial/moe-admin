export const PLAYGROUND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export type PlaygroundRole = 'admin' | 'regular'

export interface PlaygroundUser {
  _id: string
  name: string
  email: string
  role: PlaygroundRole
  isBlocked: boolean
  createdBy?: string
  createdAt?: string
}

export interface PlaygroundLoginResponse {
  access_token: string
  user: PlaygroundUser
}

export interface CreatePlaygroundUserInput {
  name: string
  email: string
  password: string
  role?: PlaygroundRole
}

async function playgroundFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PLAYGROUND_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers || {}),
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => null)
    throw new Error(errorData?.message || `Request failed: ${res.status} ${res.statusText}`)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json()
}

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

export async function playgroundLogin(email: string, password: string): Promise<PlaygroundLoginResponse> {
  return playgroundFetch<PlaygroundLoginResponse>('/results-playground/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function getPlaygroundMe(token: string): Promise<PlaygroundUser> {
  return playgroundFetch<PlaygroundUser>('/results-playground/auth/me', {
    headers: authHeader(token),
  })
}

export async function listPlaygroundUsers(token: string): Promise<PlaygroundUser[]> {
  const data = await playgroundFetch<{ users: PlaygroundUser[]; total: number }>(
    '/results-playground/auth/users',
    { headers: authHeader(token) }
  )
  return data.users
}

export async function createPlaygroundUser(
  token: string,
  input: CreatePlaygroundUserInput
): Promise<PlaygroundUser> {
  const data = await playgroundFetch<{ message: string; user: PlaygroundUser }>(
    '/results-playground/auth/users',
    {
      method: 'POST',
      headers: authHeader(token),
      body: JSON.stringify(input),
    }
  )
  return data.user
}

export async function blockPlaygroundUser(token: string, id: string): Promise<void> {
  await playgroundFetch<{ message: string }>(`/results-playground/auth/users/${id}/block`, {
    method: 'PATCH',
    headers: authHeader(token),
  })
}

export async function unblockPlaygroundUser(token: string, id: string): Promise<void> {
  await playgroundFetch<{ message: string }>(`/results-playground/auth/users/${id}/unblock`, {
    method: 'PATCH',
    headers: authHeader(token),
  })
}

export async function deletePlaygroundUser(token: string, id: string): Promise<void> {
  await playgroundFetch<void>(`/results-playground/auth/users/${id}`, {
    method: 'DELETE',
    headers: authHeader(token),
  })
}

export interface PlaygroundLog {
  _id: string
  [key: string]: unknown
}

export interface PlaygroundLogsResponse {
  logs: PlaygroundLog[]
  total: number
  page: number
  limit: number
}

export async function getPlaygroundLogs(
  token: string,
  page = 1,
  limit = 50
): Promise<PlaygroundLogsResponse> {
  return playgroundFetch<PlaygroundLogsResponse>(
    `/results-playground/logs?page=${page}&limit=${limit}`,
    { headers: authHeader(token) }
  )
}

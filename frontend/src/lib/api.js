const DEFAULT_DEV_API_BASE_URL = 'http://127.0.0.1:5000'
const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? DEFAULT_DEV_API_BASE_URL : '')

const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '')

export function buildApiUrl(path) {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with '/': ${path}`)
  }

  return API_BASE_URL ? `${API_BASE_URL}${path}` : path
}

export async function apiFetch(path, options = {}) {
  try {
    return await fetch(buildApiUrl(path), options)
  } catch (error) {
    throw new Error(
      'Could not reach the backend API. Make sure the FastAPI server is running on port 5000.'
    )
  }
}

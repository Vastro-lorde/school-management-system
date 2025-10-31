// A small, safe API client for browser-side fetch
// Returns a consistent shape: { data, error, status }

const DEFAULT_TIMEOUT_MS = 15000; // 15s

function errorToMessage(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err.name === 'AbortError') return 'Request timed out. Please try again.';
  if (err.message) return err.message;
  try { return JSON.stringify(err); } catch { return 'Unexpected error occurred'; }
}

async function parseJsonSafe(res) {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function safeFetch(path, { method = 'GET', headers, body, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(path, {
      method,
      headers: {
        'Content-Type': body ? 'application/json' : undefined,
        ...headers,
      },
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });
    clearTimeout(id);

    const status = res.status;
    const json = await parseJsonSafe(res);
    if (!res.ok) {
      const message = json?.message || json?.error || `Request failed (${status})`;
      return { data: null, error: message, status };
    }
    return { data: json, error: null, status };
  } catch (err) {
    clearTimeout(id);
    return { data: null, error: errorToMessage(err), status: 0 };
  }
}

export const apiClient = {
  get: (path, opts = {}) => safeFetch(path, { ...opts, method: 'GET' }),
  post: (path, body, opts = {}) => safeFetch(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts = {}) => safeFetch(path, { ...opts, method: 'PUT', body }),
  del: (path, opts = {}) => safeFetch(path, { ...opts, method: 'DELETE' }),
  request: safeFetch,
};

export default apiClient;

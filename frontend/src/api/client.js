import { ApiError } from './errors';

const DEFAULT_BASE_URL = 'http://localhost:8000/api/v1';

class ApiClient {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL;
    this.timeout = 15000; // 15 seconds
  }

  setBaseUrl(url) {
    this.baseUrl = url;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      params = null,
      data = null,
      headers = {},
      signal = null,
      timeout = this.timeout,
    } = options;

    let url = `${this.baseUrl}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value);
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const defaultHeaders = {
  Accept: 'application/json',
  ...headers,
};

const token = localStorage.getItem('newtonite_access_token');

if (token && !defaultHeaders.Authorization) {
  defaultHeaders.Authorization = `Bearer ${token}`;
}

    if (data && !(data instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    // Set up abort controller for timeout if no signal passed
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const effectiveSignal = signal || controller.signal;

    try {
      const response = await fetch(url, {
        method,
        headers: defaultHeaders,
        body: data ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
        credentials: 'omit', // Secure cookie sessions, avoids storing tokens in localStorage
        signal: effectiveSignal,
      });

      clearTimeout(timeoutId);

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      let responseData = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json().catch(() => null);
      } else {
        const text = await response.text().catch(() => '');
        responseData = text ? { message: text } : null;
      }

      if (!response.ok) {
        const errorMessage = responseData?.detail || responseData?.message || `Request failed with status ${response.status}`;
        throw new ApiError(errorMessage, response.status, responseData);
      }

      return responseData;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new ApiError('Request timed out. Please check your connection and try again.', 408);
      }

      if (err instanceof ApiError) {
        throw err;
      }

      // Network error (backend unreachable / CORS failure)
      throw new ApiError(
        `Unable to reach backend at ${this.baseUrl}. Please ensure the FastAPI server is running.`,
        0,
        { originalError: err.message }
      );
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', data });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', data });
  }

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', data });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

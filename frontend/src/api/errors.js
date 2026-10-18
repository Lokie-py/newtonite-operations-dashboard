export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.timestamp = new Date().toISOString();

    // Standard HTTP category flags
    this.isBadRequest = status === 400;
    this.isUnauthorized = status === 401;
    this.isForbidden = status === 403;
    this.isNotFound = status === 404;
    this.isConflict = status === 409;
    this.isValidationError = status === 422;
    this.isRateLimit = status === 429;
    this.isServerError = status >= 500;
  }

  get userMessage() {
    if (this.isConflict) {
      return this.message || 'This record was modified by another user. Please refresh to view the latest version.';
    }
    if (this.isUnauthorized) {
      return 'Your session has expired or you are not logged in. Please sign in again.';
    }
    if (this.isForbidden) {
      return 'You do not have permission to perform this action.';
    }
    if (this.isNotFound) {
      return 'The requested resource could not be found.';
    }
    if (this.isRateLimit) {
      return 'Too many requests. Please wait a moment before trying again.';
    }
    if (this.isServerError) {
      return 'An internal server error occurred. Please contact engineering support if the problem persists.';
    }
    return this.message || 'An unexpected error occurred.';
  }

  get validationErrors() {
    if (this.isValidationError && this.data?.detail) {
      if (Array.isArray(this.data.detail)) {
        // FastAPI / Pydantic validation error shape: [{ loc: ['body', 'title'], msg: 'field required' }]
        const map = {};
        this.data.detail.forEach(err => {
          const field = err.loc?.[err.loc.length - 1] || 'general';
          map[field] = err.msg;
        });
        return map;
      }
      if (typeof this.data.detail === 'object') {
        return this.data.detail;
      }
    }
    return {};
  }
}

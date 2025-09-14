/**
 * Production-ready error handling system for HemoclastOnline
 */

export interface GameError {
  type: 'network' | 'validation' | 'auth' | 'server' | 'client' | 'unknown';
  code?: string;
  message: string;
  details?: any;
  timestamp: number;
  recoverable: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: GameError[] = [];
  private maxErrorHistory = 50;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and categorize errors
   */
  handleError(error: any, context?: string): GameError {
    const gameError = this.categorizeError(error, context);
    this.logError(gameError);
    this.addToQueue(gameError);
    return gameError;
  }

  /**
   * Categorize different types of errors
   */
  private categorizeError(error: any, context?: string): GameError {
    const timestamp = Date.now();
    
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: 'network',
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection.',
        details: { originalError: error.message, context },
        timestamp,
        recoverable: true
      };
    }

    // HTTP errors
    if (error.status) {
      const statusCode = error.status;
      
      if (statusCode >= 400 && statusCode < 500) {
        return {
          type: statusCode === 401 || statusCode === 403 ? 'auth' : 'validation',
          code: `HTTP_${statusCode}`,
          message: this.getHttpErrorMessage(statusCode),
          details: { status: statusCode, context },
          timestamp,
          recoverable: statusCode !== 401
        };
      }
      
      if (statusCode >= 500) {
        return {
          type: 'server',
          code: `HTTP_${statusCode}`,
          message: 'Server error. Please try again later.',
          details: { status: statusCode, context },
          timestamp,
          recoverable: true
        };
      }
    }

    // Validation errors
    if (error.name === 'ValidationError' || error.type === 'validation') {
      return {
        type: 'validation',
        code: 'VALIDATION_ERROR',
        message: error.message || 'Please check your input and try again.',
        details: { originalError: error, context },
        timestamp,
        recoverable: true
      };
    }

    // Authentication errors
    if (error.name === 'AuthenticationError' || error.message?.includes('auth')) {
      return {
        type: 'auth',
        code: 'AUTH_ERROR',
        message: 'Authentication failed. Please log in again.',
        details: { originalError: error.message, context },
        timestamp,
        recoverable: true
      };
    }

    // Generic client errors
    if (error instanceof Error) {
      return {
        type: 'client',
        code: 'CLIENT_ERROR',
        message: error.message || 'An unexpected error occurred.',
        details: { originalError: error.message, stack: error.stack, context },
        timestamp,
        recoverable: true
      };
    }

    // Unknown errors
    return {
      type: 'unknown',
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      details: { originalError: error, context },
      timestamp,
      recoverable: true
    };
  }

  /**
   * Get user-friendly HTTP error messages
   */
  private getHttpErrorMessage(statusCode: number): string {
    const messages: { [key: number]: string } = {
      400: 'Invalid request. Please check your input.',
      401: 'Authentication required. Please log in.',
      403: 'Access denied. You don\'t have permission for this action.',
      404: 'The requested resource was not found.',
      409: 'Conflict with existing data. Please try again.',
      422: 'Invalid data provided. Please check your input.',
      429: 'Too many requests. Please wait before trying again.',
      500: 'Internal server error. Please try again later.',
      502: 'Service temporarily unavailable. Please try again later.',
      503: 'Service maintenance in progress. Please try again later.',
      504: 'Request timeout. Please try again.'
    };

    return messages[statusCode] || `Server error (${statusCode}). Please try again.`;
  }

  /**
   * Log errors for debugging
   */
  private logError(error: GameError): void {
    const logLevel = this.getLogLevel(error.type);
    const message = `[${error.type.toUpperCase()}] ${error.message}`;
    
    switch (logLevel) {
      case 'error':
        console.error(message, error.details);
        break;
      case 'warn':
        console.warn(message, error.details);
        break;
      default:
        console.log(message, error.details);
    }

    // In production, you might want to send errors to a logging service
    if (this.isProductionEnvironment()) {
      this.sendErrorToLoggingService(error);
    }
  }

  /**
   * Determine log level based on error type
   */
  private getLogLevel(errorType: string): 'error' | 'warn' | 'info' {
    switch (errorType) {
      case 'server':
      case 'client':
      case 'unknown':
        return 'error';
      case 'auth':
      case 'network':
        return 'warn';
      default:
        return 'info';
    }
  }

  /**
   * Add error to queue for display
   */
  private addToQueue(error: GameError): void {
    this.errorQueue.unshift(error);
    if (this.errorQueue.length > this.maxErrorHistory) {
      this.errorQueue = this.errorQueue.slice(0, this.maxErrorHistory);
    }
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 10): GameError[] {
    return this.errorQueue.slice(0, count);
  }

  /**
   * Clear error queue
   */
  clearErrors(): void {
    this.errorQueue = [];
  }

  /**
   * Check if running in production
   */
  private isProductionEnvironment(): boolean {
    return import.meta.env.PROD || process.env.NODE_ENV === 'production';
  }

  /**
   * Send error to external logging service (implement as needed)
   */
  private sendErrorToLoggingService(error: GameError): void {
    // Implement integration with logging services like Sentry, LogRocket, etc.
    // Example:
    // Sentry.captureException(error);
  }

  /**
   * Create user-friendly error message with retry option
   */
  createErrorMessage(error: GameError, retryCallback?: () => void): {
    title: string;
    message: string;
    actions: Array<{ text: string; callback: () => void; primary?: boolean }>;
  } {
    const actions: Array<{ text: string; callback: () => void; primary?: boolean }> = [
      { text: 'Dismiss', callback: () => {} }
    ];

    if (error.recoverable && retryCallback) {
      actions.unshift({ text: 'Retry', callback: retryCallback, primary: true });
    }

    let title = 'Error';
    switch (error.type) {
      case 'network':
        title = 'Connection Error';
        break;
      case 'auth':
        title = 'Authentication Error';
        actions.push({ 
          text: 'Login Again', 
          callback: () => {
            localStorage.clear();
            window.location.reload();
          }
        });
        break;
      case 'validation':
        title = 'Input Error';
        break;
      case 'server':
        title = 'Server Error';
        break;
    }

    return {
      title,
      message: error.message,
      actions
    };
  }

  /**
   * Handle API response errors
   */
  async handleApiResponse(response: Response, context?: string): Promise<any> {
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      const error = {
        status: response.status,
        message: errorData.detail || errorData.message || 'API request failed'
      };

      throw this.handleError(error, context);
    }

    try {
      return await response.json();
    } catch (parseError) {
      throw this.handleError(parseError, `${context} - JSON parsing`);
    }
  }

  /**
   * Wrap async functions with error handling
   */
  async withErrorHandling<T>(
    asyncFn: () => Promise<T>,
    context?: string,
    fallbackValue?: T
  ): Promise<T | undefined> {
    try {
      return await asyncFn();
    } catch (error) {
      const gameError = this.handleError(error, context);
      
      if (fallbackValue !== undefined) {
        console.warn(`Using fallback value due to error in ${context}:`, gameError.message);
        return fallbackValue;
      }
      
      throw gameError;
    }
  }
}

export default ErrorHandler;

/**
 * Error handling utilities for the email assistant
 */

// Error types for better categorization
export enum ErrorType {
  GMAIL_INTEGRATION = 'GMAIL_INTEGRATION',
  DATA_EXTRACTION = 'DATA_EXTRACTION',
  STORAGE = 'STORAGE',
  NETWORK = 'NETWORK',
  RENDERING = 'RENDERING',
  UNKNOWN = 'UNKNOWN'
}

// Interface for structured error information
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: string;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: ErrorInfo[] = [];
  private maxErrorCount: number = 100;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log an error
   */
  public handleError(
    error: Error | string,
    type: ErrorType = ErrorType.UNKNOWN,
    context: Record<string, any> = {}
  ): void {
    const errorInfo: ErrorInfo = {
      type,
      message: typeof error === 'string' ? error : error.message,
      originalError: typeof error === 'string' ? undefined : error,
      context,
      timestamp: new Date().toISOString()
    };

    // Add to in-memory log (with limit)
    this.errors.push(errorInfo);
    if (this.errors.length > this.maxErrorCount) {
      this.errors.shift();
    }

    // Log to console
    console.error(`[${errorInfo.type}] ${errorInfo.message}`, {
      context: errorInfo.context,
      originalError: errorInfo.originalError
    });

    // Could add reporting to external service here
  }

  /**
   * Helper for Gmail integration errors
   */
  public handleGmailError(error: Error | string, context: Record<string, any> = {}): void {
    this.handleError(error, ErrorType.GMAIL_INTEGRATION, context);
  }

  /**
   * Helper for data extraction errors
   */
  public handleExtractionError(error: Error | string, context: Record<string, any> = {}): void {
    this.handleError(error, ErrorType.DATA_EXTRACTION, context);
  }

  /**
   * Helper for storage errors
   */
  public handleStorageError(error: Error | string, context: Record<string, any> = {}): void {
    this.handleError(error, ErrorType.STORAGE, context);
  }

  /**
   * Helper for network errors
   */
  public handleNetworkError(error: Error | string, context: Record<string, any> = {}): void {
    this.handleError(error, ErrorType.NETWORK, context);
  }

  /**
   * Helper for UI rendering errors
   */
  public handleRenderingError(error: Error | string, context: Record<string, any> = {}): void {
    this.handleError(error, ErrorType.RENDERING, context);
  }

  /**
   * Get all logged errors
   */
  public getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  /**
   * Clear error log
   */
  public clearErrors(): void {
    this.errors = [];
  }
}

export default ErrorHandler;
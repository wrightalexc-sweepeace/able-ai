// Logging utility for Able AI

export type LogType = 'error' | 'critical' | 'warning' | 'analytics' | 'other';

export interface AppLogError {
  code: number;
  message: string;
  type: LogType;
  details?: unknown;
}

// Predefined error codes/messages/types
export const ERROR_CODES = {
  UNKNOWN: { code: 10000, message: 'Unknown error', type: 'error' as LogType },
  MODEL_NOT_SUPPORTED: { code: 10001, message: 'Model not supported', type: 'error' as LogType },
  SCHEMA_VALIDATION_FAILED: { code: 10002, message: 'Schema validation failed', type: 'error' as LogType },
  AI_API_ERROR: { code: 10003, message: 'AI API error', type: 'error' as LogType },
  STREAM_NOT_IMPLEMENTED: { code: 10004, message: 'Streaming not implemented', type: 'warning' as LogType },
  // Add more as needed
};

// Client-side logger (frontend)
export function logClient(error: AppLogError) {
  if (typeof window !== 'undefined') {
    // Could extend to send to a remote logging service
    if (error.type === 'error' || error.type === 'critical') {
      console.error(`[Client][${error.type}] [${error.code}] ${error.message}`, error.details);
    } else {
      console.log(`[Client][${error.type}] [${error.code}] ${error.message}`, error.details);
    }
  }
}

// Server-side logger (backend)
export function logServer(error: AppLogError) {
  if (typeof window === 'undefined') {
    // Could extend to send to a remote logging service
    if (error.type === 'error' || error.type === 'critical') {
      console.error(`[Server][${error.type}] [${error.code}] ${error.message}`, error.details);
    } else {
      console.log(`[Server][${error.type}] [${error.code}] ${error.message}`, error.details);
    }
  }
} 
/**
 * Structured JSON logger for Foundrie AI
 * 
 * Provides centralized, structured logging with trace ID correlation
 * for API routes and application code.
 */

import { randomUUID } from "crypto";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  trace_id?: string;
  user_id?: string;
  project_id?: string;
  [key: string]: unknown;
}

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const logEntry = {
      timestamp: this.getTimestamp(),
      level,
      message,
      trace_id: context?.trace_id || randomUUID(),
      ...context,
    };

    // Output as JSON to stdout/stderr
    const output = JSON.stringify(logEntry);
    
    if (level === "error") {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }
}

export const logger = new Logger();

/**
 * Helper to generate a trace ID for request correlation
 */
export function generateTraceId(): string {
  return randomUUID();
}

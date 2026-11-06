// Error handling. Everything here is done.
import type { Response } from "express"
import type { ZodError } from "zod"

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_JSON"
  | "NOT_FOUND"
  | "SESSION_NOT_FOUND"
  | "SESSION_FULL"
  | "ALREADY_REGISTERED"
  | "SCHEDULE_CONFLICT"
  | "NOT_IMPLEMENTED"
  | "INTERNAL_ERROR"

/**
 * Sends an error in the same format everywhere:
 * { "error": "SESSION_NOT_FOUND", "message": "Session s99 does not exist" }
 */
export function sendError(res: Response, status: number, error: ErrorCode, message: string, details?: unknown): void {
  res.status(status).json(details === undefined ? { error, message } : { error, message, details })
}

/** 400 with Zod's issues, e.g. { path: "email", message: "Invalid email address" }. */
export function sendValidationError(res: Response, zodError: ZodError): void {
  const details = zodError.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
  sendError(res, 400, "VALIDATION_ERROR", "The request contains invalid data", details)
}

export function sendNotImplemented(res: Response, task: string): void {
  sendError(res, 501, "NOT_IMPLEMENTED", task)
}

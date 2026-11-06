import { Router } from "express"
import { sendError, sendValidationError } from "./errors.ts"
import { registrationSchema, sessionPatchSchema, sessionSchema } from "./schemas.ts"
import {
  countRegistrations,
  createRegistration,
  createSession,
  deleteSession,
  getSession,
  listRegistrations,
  listRegistrationsByEmail,
  listSessions,
  updateSession,
  type Session,
} from "./store.ts"

export const router = Router()

// ─── Task 6: Show seats left ────────────────────────────────
function toSessionResponse(session: Session) {
  return { ...session, seatsLeft: session.capacity - countRegistrations(session.id) }
}

// ─── Task 9: Schedule conflict ──────────────────────────────
function overlaps(a: Session, b: Session): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt
}

// ─── Example: List all sessions ─────────────────────────────
router.get("/api/sessions", (req, res) => {
  res.json(listSessions().map(toSessionResponse))
})

// ─── Example: Create a session ──────────────────────────────
router.post("/api/sessions", (req, res) => {
  const result = sessionSchema.safeParse(req.body)
  if (!result.success) return sendValidationError(res, result.error)

  const session = createSession(result.data)
  res.status(201).json(toSessionResponse(session))
})

// ─── Task 1: Get a session ──────────────────────────────────
router.get("/api/sessions/:id", (req, res) => {
  const session = getSession(req.params.id)
  if (!session) return sendError(res, 404, "SESSION_NOT_FOUND", `Session ${req.params.id} does not exist`)

  res.json(toSessionResponse(session))
})

// ─── Task 2: Delete a session ───────────────────────────────
router.delete("/api/sessions/:id", (req, res) => {
  const deleted = deleteSession(req.params.id)
  if (!deleted) return sendError(res, 404, "SESSION_NOT_FOUND", `Session ${req.params.id} does not exist`)

  res.status(204).end()
})

// ─── Task 3: Update a session ───────────────────────────────
router.patch("/api/sessions/:id", (req, res) => {
  const result = sessionPatchSchema.safeParse(req.body)
  if (!result.success) return sendValidationError(res, result.error)

  const session = updateSession(req.params.id, result.data)
  if (!session) return sendError(res, 404, "SESSION_NOT_FOUND", `Session ${req.params.id} does not exist`)

  res.json(toSessionResponse(session))
})

// ─── Task 4: Register an attendee (+ rules in tasks 7–9) ────
router.post("/api/sessions/:id/registrations", (req, res) => {
  const session = getSession(req.params.id)
  if (!session) return sendError(res, 404, "SESSION_NOT_FOUND", `Session ${req.params.id} does not exist`)

  const result = registrationSchema.safeParse(req.body)
  if (!result.success) return sendValidationError(res, result.error)
  const { email } = result.data

  // Task 7: Session full
  if (countRegistrations(session.id) >= session.capacity) {
    return sendError(res, 409, "SESSION_FULL", `${session.title} is fully booked`)
  }

  const existingRegistrations = listRegistrationsByEmail(email)

  // Task 8: Already registered
  if (existingRegistrations.some((registration) => registration.sessionId === session.id)) {
    return sendError(res, 409, "ALREADY_REGISTERED", `${email} is already registered for ${session.title}`)
  }

  // Task 9: Schedule conflict
  const conflictingSession = existingRegistrations
    .map((registration) => getSession(registration.sessionId))
    .find((other) => other !== undefined && overlaps(session, other))
  if (conflictingSession) {
    return sendError(
      res,
      409,
      "SCHEDULE_CONFLICT",
      `${email} is already registered for ${conflictingSession.title}, which overlaps in time`,
    )
  }

  const registration = createRegistration(session.id, result.data)
  res.status(201).json(registration)
})

// ─── Task 5: List registrations ─────────────────────────────
router.get("/api/sessions/:id/registrations", (req, res) => {
  const session = getSession(req.params.id)
  if (!session) return sendError(res, 404, "SESSION_NOT_FOUND", `Session ${req.params.id} does not exist`)

  res.json(listRegistrations(session.id))
})

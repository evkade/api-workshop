import { Router } from "express"
import { sendError, sendNotImplemented, sendValidationError } from "./errors.ts"
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
// Every session response goes through this function.
// TODO: Add the field seatsLeft (capacity minus number of registrations).
// Useful: countRegistrations(sessionId)
function toSessionResponse(session: Session) {
  return { ...session }
}

// ─── Example: List all sessions ─────────────────────────────
router.get("/api/sessions", (req, res) => {
  res.json(listSessions().map(toSessionResponse))
})

// ─── Example: Create a session ──────────────────────────────
// Note: This is how you validate a body with Zod.
router.post("/api/sessions", (req, res) => {
  const result = sessionSchema.safeParse(req.body)
  if (!result.success) return sendValidationError(res, result.error)

  const session = createSession(result.data)
  res.status(201).json(toSessionResponse(session))
})

// ─── Task 1: Get a session ──────────────────────────────────
// 200 + the session, or 404 SESSION_NOT_FOUND if it does not exist.
// Useful: req.params.id, getSession(id), sendError(res, 404, "SESSION_NOT_FOUND", "…")
router.get("/api/sessions/:id", (req, res) => {
  sendNotImplemented(res, "Task 1: GET /api/sessions/:id")
})

// ─── Task 2: Delete a session ───────────────────────────────
// 204 without a body, or 404 SESSION_NOT_FOUND.
// Useful: deleteSession(id) returns true/false, res.status(204).end()
router.delete("/api/sessions/:id", (req, res) => {
  sendNotImplemented(res, "Task 2: DELETE /api/sessions/:id")
})

// ─── Task 3: Update a session ───────────────────────────────
// 200 + the updated session, 400 VALIDATION_ERROR for an invalid body, 404 SESSION_NOT_FOUND.
// Useful: sessionPatchSchema, sendValidationError(res, error), updateSession(id, changes)
router.patch("/api/sessions/:id", (req, res) => {
  sendNotImplemented(res, "Task 3: PATCH /api/sessions/:id")
})

// ─── Task 4: Register an attendee ───────────────────────────
// 201 + the new registration, 400 VALIDATION_ERROR, 404 SESSION_NOT_FOUND.
// Write registrationSchema in schemas.ts first.
// Useful: registrationSchema, createRegistration(sessionId, { name, email })
//
// Tasks 7–9 are rules you add here, before the registration is saved:
// • Task 7: 409 SESSION_FULL if all seats are taken.
//   Useful: countRegistrations(sessionId), session.capacity
// • Task 8: 409 ALREADY_REGISTERED if the email is already registered for the session.
//   Useful: listRegistrationsByEmail(email)
// • Task 9: 409 SCHEDULE_CONFLICT if the person is registered for a session that overlaps in time.
//   Useful: listRegistrationsByEmail(email), getSession(id). There is a hint in the README.
router.post("/api/sessions/:id/registrations", (req, res) => {
  sendNotImplemented(res, "Task 4: POST /api/sessions/:id/registrations")
})

// ─── Task 5: List registrations ─────────────────────────────
// 200 + a list of the session's registrations, or 404 SESSION_NOT_FOUND.
// Useful: listRegistrations(sessionId)
router.get("/api/sessions/:id/registrations", (req, res) => {
  sendNotImplemented(res, "Task 5: GET /api/sessions/:id/registrations")
})

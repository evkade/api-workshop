// In-memory data. Everything here is done – you do not need to change this file.
// The data is reset every time the server restarts.

export interface Session {
  id: string
  title: string
  speaker: string
  room: string
  startsAt: string
  endsAt: string
  capacity: number
}

export type NewSession = Omit<Session, "id">

export interface Registration {
  id: string
  sessionId: string
  name: string
  email: string
  registeredAt: string
}

export type NewRegistration = Pick<Registration, "name" | "email">

const seedSessions: Session[] = [
  { id: "s1", title: "Keynote: APIs that last for ten years", speaker: "Maja Lindqvist", room: "Room A", startsAt: "2026-11-20T09:00", endsAt: "2026-11-20T09:45", capacity: 120 },
  { id: "s2", title: "REST for real: status codes that mean something", speaker: "Omar Haddad", room: "Room A", startsAt: "2026-11-20T10:00", endsAt: "2026-11-20T10:45", capacity: 40 },
  { id: "s3", title: "TypeScript for JavaScript developers", speaker: "Elin Berg", room: "Room B", startsAt: "2026-11-20T10:00", endsAt: "2026-11-20T10:45", capacity: 30 },
  { id: "s4", title: "Workshop: test your API", speaker: "Jonas Ek", room: "Room C", startsAt: "2026-11-20T10:30", endsAt: "2026-11-20T11:15", capacity: 3 },
  { id: "s5", title: "Security for web developers", speaker: "Sara Nilsson", room: "Room A", startsAt: "2026-11-20T11:00", endsAt: "2026-11-20T11:45", capacity: 50 },
  { id: "s6", title: "Databases without drama", speaker: "Ali Rahimi", room: "Room B", startsAt: "2026-11-20T13:00", endsAt: "2026-11-20T13:45", capacity: 25 },
  { id: "s7", title: "Accessibility in practice", speaker: "Hanna Svensson", room: "Room C", startsAt: "2026-11-20T13:00", endsAt: "2026-11-20T14:00", capacity: 20 },
  { id: "s8", title: "From idea to production", speaker: "Erik Holm", room: "Room A", startsAt: "2026-11-20T14:00", endsAt: "2026-11-20T14:45", capacity: 60 },
]

const seedRegistrations: Registration[] = [
  { id: "r1", sessionId: "s1", name: "Anna Karlsson", email: "anna@example.com", registeredAt: "2026-11-01T08:00:00.000Z" },
  { id: "r2", sessionId: "s4", name: "Anna Karlsson", email: "anna@example.com", registeredAt: "2026-11-01T08:01:00.000Z" },
  { id: "r3", sessionId: "s4", name: "Ben Olsson", email: "ben@example.com", registeredAt: "2026-11-01T09:30:00.000Z" },
  { id: "r4", sessionId: "s8", name: "Ben Olsson", email: "ben@example.com", registeredAt: "2026-11-01T09:31:00.000Z" },
  { id: "r5", sessionId: "s6", name: "Cecilia Strom", email: "cecilia@example.com", registeredAt: "2026-11-02T12:00:00.000Z" },
]

let sessions: Session[] = []
let registrations: Registration[] = []
let nextSessionNumber = 1
let nextRegistrationNumber = 1

export function resetStore(): void {
  sessions = seedSessions.map((session) => ({ ...session }))
  registrations = seedRegistrations.map((registration) => ({ ...registration }))
  nextSessionNumber = sessions.length + 1
  nextRegistrationNumber = registrations.length + 1
}

resetStore()

// ─── Sessions ───────────────────────────────────────────────

export function listSessions(): Session[] {
  return [...sessions].sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.room.localeCompare(b.room))
}

export function getSession(id: string): Session | undefined {
  return sessions.find((session) => session.id === id)
}

export function createSession(input: NewSession): Session {
  const session: Session = { id: `s${nextSessionNumber++}`, ...input }
  sessions.push(session)
  return session
}

export function updateSession(id: string, changes: Partial<NewSession>): Session | undefined {
  const session = getSession(id)
  if (!session) return undefined
  Object.assign(session, changes)
  return session
}

/** Deletes the session and all its registrations. Returns false if the session did not exist. */
export function deleteSession(id: string): boolean {
  const sessionCountBefore = sessions.length
  sessions = sessions.filter((session) => session.id !== id)
  registrations = registrations.filter((registration) => registration.sessionId !== id)
  return sessions.length < sessionCountBefore
}

// ─── Registrations ──────────────────────────────────────────

export function listRegistrations(sessionId: string): Registration[] {
  return registrations.filter((registration) => registration.sessionId === sessionId)
}

export function countRegistrations(sessionId: string): number {
  return listRegistrations(sessionId).length
}

/** All registrations for an email address, across sessions. Case-insensitive. */
export function listRegistrationsByEmail(email: string): Registration[] {
  const normalizedEmail = email.toLowerCase()
  return registrations.filter((registration) => registration.email.toLowerCase() === normalizedEmail)
}

export function getRegistration(id: string): Registration | undefined {
  return registrations.find((registration) => registration.id === id)
}

export function createRegistration(sessionId: string, input: NewRegistration): Registration {
  const registration: Registration = {
    id: `r${nextRegistrationNumber++}`,
    sessionId,
    name: input.name,
    email: input.email,
    registeredAt: new Date().toISOString(),
  }
  registrations.push(registration)
  return registration
}

/** Returns false if the registration did not exist. */
export function deleteRegistration(id: string): boolean {
  const countBefore = registrations.length
  registrations = registrations.filter((registration) => registration.id !== id)
  return registrations.length < countBefore
}

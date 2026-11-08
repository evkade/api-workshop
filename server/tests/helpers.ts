import assert from "node:assert/strict"
import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import { after, before, beforeEach } from "node:test"
import { createApp } from "../src/app.ts"
import { createRegistration, createSession, resetStore, type NewSession } from "../src/store.ts"

export interface ApiResponse {
  status: number
  body: any
}

type Method = "GET" | "POST" | "PATCH" | "DELETE"

/** Starts the server on a free port and resets the data before every test. */
export function useTestServer() {
  let server: Server
  let baseUrl = ""

  before(async () => {
    server = createApp().listen(0)
    await new Promise((resolve) => server.once("listening", resolve))
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`
  })

  after(() => {
    server.closeAllConnections()
    server.close()
  })

  beforeEach(() => resetStore())

  async function request(method: Method, path: string, body?: unknown): Promise<ApiResponse> {
    const response = await fetch(baseUrl + path, {
      method,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await response.text()
    return { status: response.status, body: parseJson(text) }
  }

  return {
    get: (path: string) => request("GET", path),
    post: (path: string, body?: unknown) => request("POST", path, body),
    patch: (path: string, body?: unknown) => request("PATCH", path, body),
    delete: (path: string) => request("DELETE", path),
  }
}

function parseJson(text: string): unknown {
  try {
    return text === "" ? undefined : JSON.parse(text)
  } catch {
    return text
  }
}

const defaultSession: NewSession = {
  title: "Test session",
  speaker: "Tess Tester",
  room: "Test room",
  startsAt: "2026-11-20T10:00",
  endsAt: "2026-11-20T11:00",
  capacity: 10,
}

export function givenSession(overrides: Partial<NewSession> = {}) {
  return createSession({ ...defaultSession, ...overrides })
}

export function givenRegistrations(sessionId: string, count: number) {
  return Array.from({ length: count }, (_, index) =>
    createRegistration(sessionId, { name: `Attendee ${index + 1}`, email: `attendee${index + 1}@example.com` }),
  )
}

/** Checks the status code and explains in plain words what went wrong. */
export function expectStatus(response: ApiResponse, expected: number, situation: string) {
  assert.equal(
    response.status,
    expected,
    `Expected ${expected} ${situation}, but got ${response.status}${explain(response)}`,
  )
}

export function expectError(response: ApiResponse, expectedStatus: number, expectedCode: string, situation: string) {
  expectStatus(response, expectedStatus, situation)
  assert.equal(
    response.body?.error,
    expectedCode,
    `Expected the error code "${expectedCode}" ${situation}, but the body was ${JSON.stringify(response.body)}`,
  )
}

function explain(response: ApiResponse): string {
  if (response.status === 501) return ` – ${response.body?.message ?? "the endpoint"} is not done yet`
  if (response.status === 404 && response.body?.error === "NOT_FOUND") return " – the endpoint does not exist"
  if (response.status >= 400) return ` (${JSON.stringify(response.body)})`
  return ""
}

/** For tasks 7–9: they build on the registration endpoint from task 4. */
export function expectRegistrationEndpointExists(response: ApiResponse) {
  assert.notEqual(response.status, 501, "This task builds on POST /api/sessions/:id/registrations. Do task 4 first.")
}

import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { listRegistrations } from "../src/store.ts"
import { expectError, expectStatus, givenSession, useTestServer } from "./helpers.ts"

describe("Task 4: POST /api/sessions/:id/registrations", () => {
  const api = useTestServer()

  test("responds 201 with the new registration", async () => {
    const session = givenSession()

    const response = await api.post(`/api/sessions/${session.id}/registrations`, {
      name: "Kim Larsson",
      email: "kim@example.com",
    })

    expectStatus(response, 201, "when the registration is valid")
    assert.equal(response.body.sessionId, session.id, "The registration should belong to the right session")
    assert.equal(response.body.email, "kim@example.com", "The response should contain the email address")
    assert.ok(response.body.id, "The response should contain the registration id")
    assert.equal(listRegistrations(session.id).length, 1, "The registration was not saved, use createRegistration()")
  })

  test("responds 400 VALIDATION_ERROR if the email is invalid", async () => {
    const session = givenSession()

    const response = await api.post(`/api/sessions/${session.id}/registrations`, {
      name: "Kim Larsson",
      email: "not-an-email",
    })

    expectError(response, 400, "VALIDATION_ERROR", "when email is not an email address")
  })

  test("responds 400 VALIDATION_ERROR if name is missing", async () => {
    const session = givenSession()

    const response = await api.post(`/api/sessions/${session.id}/registrations`, { email: "kim@example.com" })

    expectError(response, 400, "VALIDATION_ERROR", "when name is missing")
  })

  test("responds 404 SESSION_NOT_FOUND if the session does not exist", async () => {
    const response = await api.post("/api/sessions/does-not-exist/registrations", {
      name: "Kim Larsson",
      email: "kim@example.com",
    })

    expectError(response, 404, "SESSION_NOT_FOUND", "when the session does not exist")
  })
})

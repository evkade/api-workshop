import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { expectError, expectStatus, givenRegistrations, givenSession, useTestServer } from "./helpers.ts"

describe("Task 5: GET /api/sessions/:id/registrations", () => {
  const api = useTestServer()

  test("responds 200 with the session's registrations", async () => {
    const session = givenSession()
    const otherSession = givenSession()
    givenRegistrations(session.id, 2)
    givenRegistrations(otherSession.id, 3)

    const response = await api.get(`/api/sessions/${session.id}/registrations`)

    expectStatus(response, 200, "when the session exists")
    assert.ok(Array.isArray(response.body), `Expected a list, but got ${JSON.stringify(response.body)}`)
    assert.equal(response.body.length, 2, "The list should only contain registrations for this session")
  })

  test("responds 200 with an empty list if nobody is registered", async () => {
    const session = givenSession()

    const response = await api.get(`/api/sessions/${session.id}/registrations`)

    expectStatus(response, 200, "when the session has no registrations")
    assert.deepEqual(response.body, [], "Expected an empty list")
  })

  test("responds 404 SESSION_NOT_FOUND if the session does not exist", async () => {
    const response = await api.get("/api/sessions/does-not-exist/registrations")

    expectError(response, 404, "SESSION_NOT_FOUND", "when the session does not exist")
  })
})

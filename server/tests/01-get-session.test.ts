import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { expectError, expectStatus, givenSession, useTestServer } from "./helpers.ts"

describe("Task 1: GET /api/sessions/:id", () => {
  const api = useTestServer()

  test("responds 200 with the session", async () => {
    const session = givenSession({ title: "Fetch me" })

    const response = await api.get(`/api/sessions/${session.id}`)

    expectStatus(response, 200, "when the session exists")
    assert.equal(response.body.id, session.id, "The response should contain the right session")
    assert.equal(response.body.title, "Fetch me", "The response should contain the session title")
  })

  test("responds 404 SESSION_NOT_FOUND if the session does not exist", async () => {
    const response = await api.get("/api/sessions/does-not-exist")

    expectError(response, 404, "SESSION_NOT_FOUND", "when the session does not exist")
  })
})

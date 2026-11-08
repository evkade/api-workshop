import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { getSession } from "../src/store.ts"
import { expectError, expectStatus, givenSession, useTestServer } from "./helpers.ts"

describe("Task 2: DELETE /api/sessions/:id", () => {
  const api = useTestServer()

  test("responds 204 and deletes the session", async () => {
    const session = givenSession()

    const response = await api.delete(`/api/sessions/${session.id}`)

    expectStatus(response, 204, "when the session is deleted")
    assert.equal(response.body, undefined, "A 204 response should not have a body")
    assert.equal(getSession(session.id), undefined, "The session still exists after DELETE, use deleteSession()")
  })

  test("responds 404 SESSION_NOT_FOUND if the session does not exist", async () => {
    const response = await api.delete("/api/sessions/does-not-exist")

    expectError(response, 404, "SESSION_NOT_FOUND", "when the session does not exist")
  })
})

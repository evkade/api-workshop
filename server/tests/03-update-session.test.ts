import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { getSession } from "../src/store.ts"
import { expectError, expectStatus, givenSession, useTestServer } from "./helpers.ts"

describe("Task 3: PATCH /api/sessions/:id", () => {
  const api = useTestServer()

  test("responds 200 and only changes the fields in the body", async () => {
    const session = givenSession({ title: "Old title", capacity: 10 })

    const response = await api.patch(`/api/sessions/${session.id}`, { title: "New title" })

    expectStatus(response, 200, "when the update is valid")
    assert.equal(response.body.title, "New title", "The response should contain the new title")
    assert.equal(
      getSession(session.id)?.title,
      "New title",
      "The title was not changed in the store, use updateSession()",
    )
    assert.equal(getSession(session.id)?.capacity, 10, "Fields that were not sent should be unchanged")
  })

  test("responds 400 VALIDATION_ERROR for an invalid body", async () => {
    const session = givenSession({ capacity: 10 })

    const response = await api.patch(`/api/sessions/${session.id}`, { capacity: -5 })

    expectError(response, 400, "VALIDATION_ERROR", "when capacity is negative")
    assert.equal(getSession(session.id)?.capacity, 10, "The session should not change when the body is invalid")
  })

  test("responds 404 SESSION_NOT_FOUND if the session does not exist", async () => {
    const response = await api.patch("/api/sessions/does-not-exist", { title: "New title" })

    expectError(response, 404, "SESSION_NOT_FOUND", "when the session does not exist")
  })
})

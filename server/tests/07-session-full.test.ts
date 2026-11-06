import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { listRegistrations } from "../src/store.ts"
import { expectError, expectRegistrationEndpointExists, givenRegistrations, givenSession, useTestServer } from "./helpers.ts"

describe("Task 7: Session full", () => {
  const api = useTestServer()

  test("responds 409 SESSION_FULL when all seats are taken", async () => {
    const session = givenSession({ capacity: 2 })
    givenRegistrations(session.id, 2)

    const response = await api.post(`/api/sessions/${session.id}/registrations`, {
      name: "Late Arrival",
      email: "late@example.com",
    })

    expectRegistrationEndpointExists(response)
    expectError(response, 409, "SESSION_FULL", "when the session is fully booked")
    assert.equal(listRegistrations(session.id).length, 2, "No new registration should be saved when the session is full")
  })
})

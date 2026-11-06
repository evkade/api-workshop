import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { createRegistration, listRegistrations } from "../src/store.ts"
import { expectError, expectRegistrationEndpointExists, givenSession, useTestServer } from "./helpers.ts"

describe("Task 8: Already registered", () => {
  const api = useTestServer()

  test("responds 409 ALREADY_REGISTERED if the email is already registered", async () => {
    const session = givenSession()
    createRegistration(session.id, { name: "Kim Larsson", email: "kim@example.com" })

    const response = await api.post(`/api/sessions/${session.id}/registrations`, {
      name: "Kim Larsson",
      email: "kim@example.com",
    })

    expectRegistrationEndpointExists(response)
    expectError(response, 409, "ALREADY_REGISTERED", "when the same email registers twice")
    assert.equal(listRegistrations(session.id).length, 1, "A duplicate registration should not be saved")
  })
})

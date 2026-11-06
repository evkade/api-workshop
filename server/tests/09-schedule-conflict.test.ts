import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { createRegistration } from "../src/store.ts"
import { expectError, expectRegistrationEndpointExists, expectStatus, givenSession, useTestServer } from "./helpers.ts"

const kim = { name: "Kim Larsson", email: "kim@example.com" }

describe("Task 9: Schedule conflict", () => {
  const api = useTestServer()

  test("responds 409 SCHEDULE_CONFLICT if the sessions overlap in time", async () => {
    const booked = givenSession({ room: "Room A", startsAt: "2026-11-20T10:00", endsAt: "2026-11-20T11:00" })
    const overlapping = givenSession({ room: "Room B", startsAt: "2026-11-20T10:30", endsAt: "2026-11-20T11:30" })
    createRegistration(booked.id, kim)

    const response = await api.post(`/api/sessions/${overlapping.id}/registrations`, kim)

    expectRegistrationEndpointExists(response)
    expectError(response, 409, "SCHEDULE_CONFLICT", "when 10:30–11:30 overlaps a booked session 10:00–11:00")
  })

  test("responds 409 SCHEDULE_CONFLICT when one session is entirely inside another", async () => {
    const booked = givenSession({ startsAt: "2026-11-20T09:00", endsAt: "2026-11-20T12:00" })
    const inside = givenSession({ startsAt: "2026-11-20T10:00", endsAt: "2026-11-20T10:30" })
    createRegistration(booked.id, kim)

    const response = await api.post(`/api/sessions/${inside.id}/registrations`, kim)

    expectRegistrationEndpointExists(response)
    expectError(response, 409, "SCHEDULE_CONFLICT", "when 10:00–10:30 is inside a booked session 09:00–12:00")
  })

  test("allows sessions that end exactly when the next one starts", async () => {
    const booked = givenSession({ startsAt: "2026-11-20T10:00", endsAt: "2026-11-20T11:00" })
    const next = givenSession({ startsAt: "2026-11-20T11:00", endsAt: "2026-11-20T12:00" })
    createRegistration(booked.id, kim)

    const response = await api.post(`/api/sessions/${next.id}/registrations`, kim)

    expectRegistrationEndpointExists(response)
    expectStatus(response, 201, "when 11:00–12:00 comes right after 10:00–11:00 (that is not a conflict)")
    assert.equal(response.body.sessionId, next.id)
  })
})

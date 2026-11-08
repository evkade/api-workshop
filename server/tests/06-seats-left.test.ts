import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { expectStatus, givenRegistrations, givenSession, useTestServer } from "./helpers.ts"

describe("Task 6: seatsLeft in session responses", () => {
  const api = useTestServer()

  test("GET /api/sessions shows seats left for every session", async () => {
    const session = givenSession({ capacity: 10 })
    givenRegistrations(session.id, 3)

    const response = await api.get("/api/sessions")

    expectStatus(response, 200, "from GET /api/sessions")
    const listed = response.body.find((candidate: { id: string }) => candidate.id === session.id)
    assert.equal(listed.seatsLeft, 7, `Expected seatsLeft 7 (capacity 10 − 3 registered), but got ${listed.seatsLeft}`)
  })

  test("POST /api/sessions shows seats left for the new session", async () => {
    const response = await api.post("/api/sessions", {
      title: "New session",
      speaker: "Tess Tester",
      room: "Amfi",
      startsAt: "2026-11-20T16:00",
      endsAt: "2026-11-20T16:45",
      capacity: 15,
    })

    expectStatus(response, 201, "from POST /api/sessions")
    assert.equal(response.body.seatsLeft, 15, `Expected seatsLeft 15 for a new session, but got ${response.body.seatsLeft}`)
  })
})

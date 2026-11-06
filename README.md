# API workshop: Conference API

You have been given a half-finished API for a conference. There are sessions in different rooms, and visitors can register for them. The frontend is done, but several endpoints in the API are missing. Your job is to build them.

**You only work in one file: [`server/src/routes.ts`](server/src/routes.ts)** (and in task 4 also in [`server/src/schemas.ts`](server/src/schemas.ts)).

The stack is Express, TypeScript and [Zod](https://zod.dev) for validation.

## Goals for the hour

| Level | Tasks | What you get |
| --- | --- | --- |
| 🎯 **Core goal** | 1–6 | The whole frontend works. Most people get this far. |
| 💪 **Well done** | 7–9 | The business rules: fully booked, duplicate registration and schedule conflicts. |
| 🚀 **Bonus** | | For the fastest, see [Bonus](#bonus). |

The tasks are **independent of each other**. Stuck? Skip to the next task. (Exception: tasks 7–9 build on the endpoint from task 4.)

## Getting started

Pick the option that suits you:

### A. In the browser with StackBlitz (nothing to install)

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/evkade/api-workshop)

Everything starts on its own. Open a new terminal (`+`) and run `npm run test:watch`.

### B. GitHub Codespaces (requires a GitHub account)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/evkade/api-workshop)

Wait for the server to start. The schedule opens in a tab. Open a new terminal and run `npm run test:watch`.

### C. Locally (requires Node 20.6 or later)

```sh
git clone https://github.com/evkade/api-workshop.git
cd api-workshop
npm install
npm run dev
```

No git? Click **Code → Download ZIP** and unzip it. Then open <http://localhost:3000> and run `npm run test:watch` in a second terminal.

### Good to know

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the API and the frontend on port 3000. Restarts when you save. |
| `npm run test:watch` | Runs the tests and reruns them when you save. Watch the tasks turn green! |
| `npm test` | Runs the tests once. |

- The data lives in memory and is reset when the server restarts.
- [`server/requests.http`](server/requests.http) contains ready-made requests for the VS Code extension [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client). You can also use `curl`, Postman or the frontend.
- Endpoints that are not done yet respond `501 NOT_IMPLEMENTED` and tell you which task they belong to. The frontend shows the same text.

## How the code is organized

```
client/            the frontend: plain HTML, CSS and JavaScript (done)
server/
  src/
    routes.ts      ← you work here: the examples and tasks 1–9 in order
    schemas.ts     Zod schemas. You write registrationSchema in task 4
    store.ts       the in-memory data and every function to read and change it (done)
    errors.ts      sendError() and the error codes (done)
    app.ts         the Express app, also serves the client (done)
    server.ts      starts the server (done)
  tests/           one test file per task
  requests.http    ready-made requests for REST Client
```

The server serves both the API (`/api/…`) and the client on the same port, so there is only one thing to start.

All data handling already exists in `store.ts`, for example `getSession(id)`, `deleteSession(id)` and `listRegistrationsByEmail(email)`. Your job is the HTTP part: the right status code, the right response and the right rules.

Start by reading the two **examples** at the top of `routes.ts`. They show the pattern the rest of the tasks follow.

### Data model

```jsonc
// Session
{ "id": "s1", "title": "…", "speaker": "…", "room": "Room A",
  "startsAt": "2026-11-20T09:00", "endsAt": "2026-11-20T09:45", "capacity": 120 }

// Registration
{ "id": "r1", "sessionId": "s1", "name": "Anna Karlsson",
  "email": "anna@example.com", "registeredAt": "2026-11-01T08:00:00.000Z" }
```

### Error format

All errors have the same format. Use `sendError(res, status, errorCode, message)`:

```json
{ "error": "SESSION_NOT_FOUND", "message": "Session s99 does not exist" }
```

## Tasks

| # | Task | Endpoint | Responses | ~time |
| --- | --- | --- | --- | --- |
| 1 | Get a session | `GET /api/sessions/:id` | 200, 404 `SESSION_NOT_FOUND` | 5 min |
| 2 | Delete a session | `DELETE /api/sessions/:id` | 204, 404 | 5 min |
| 3 | Update a session | `PATCH /api/sessions/:id` | 200, 400 `VALIDATION_ERROR`, 404 | 8 min |
| 4 | Register an attendee | `POST /api/sessions/:id/registrations` | 201, 400, 404 | 10 min |
| 5 | List registrations | `GET /api/sessions/:id/registrations` | 200, 404 | 4 min |
| 6 | Show seats left | `seatsLeft` in every session response | | 5 min |
| 7 | Fully booked | `POST …/registrations` | 409 `SESSION_FULL` | 4 min |
| 8 | Duplicate registration | `POST …/registrations` | 409 `ALREADY_REGISTERED` | 4 min |
| 9 | Schedule conflict | `POST …/registrations` | 409 `SCHEDULE_CONFLICT` | 10 min |

### 1. Get a session

`GET /api/sessions/:id` responds `200` with the session. If it does not exist, it responds `404` with the error code `SESSION_NOT_FOUND`.

<details>
<summary>Hint</summary>

- The id is in `req.params.id`.
- `getSession(id)` returns the session or `undefined`.
- Pass the session through `toSessionResponse(session)` so that task 6 applies everywhere.

</details>

### 2. Delete a session

`DELETE /api/sessions/:id` responds `204 No Content` (without a body). If the session does not exist, it responds `404 SESSION_NOT_FOUND`.

<details>
<summary>Hint</summary>

- `deleteSession(id)` returns `true` if something was deleted and `false` if the session did not exist.
- `res.status(204).end()` sends a response without a body.

</details>

### 3. Update a session

`PATCH /api/sessions/:id` changes only the fields that are sent and responds `200` with the updated session. An invalid body gives `400 VALIDATION_ERROR` and an unknown session gives `404`.

<details>
<summary>Hint</summary>

- `sessionPatchSchema` already exists in `schemas.ts`. Every field is optional in that schema.
- Do as in the example `POST /api/sessions`: `safeParse`, then `sendValidationError` if it fails.
- `updateSession(id, changes)` returns the updated session or `undefined`.

</details>

### 4. Register an attendee

`POST /api/sessions/:id/registrations` with `{ "name": "…", "email": "…" }` responds `201` with the new registration.

First write `registrationSchema` in `server/src/schemas.ts`: `name` must not be empty and `email` must be a valid email address. An invalid body gives `400`, an unknown session gives `404`.

<details>
<summary>Hint</summary>

- Look at `sessionSchema` to see how fields are written.
- In Zod 4, an email address is written as `z.email()`.
- `createRegistration(sessionId, { name, email })` saves the registration and returns it.

</details>

### 5. List registrations

`GET /api/sessions/:id/registrations` responds `200` with a list of the session's registrations (an empty list if nobody is registered) and `404` if the session does not exist.

<details>
<summary>Hint</summary>

`listRegistrations(sessionId)` does the job. Don't forget to check that the session exists first.

</details>

### 6. Show seats left

Every response that contains a session should also have the field `seatsLeft`: the number of seats minus the number of registrations.

<details>
<summary>Hint</summary>

Change the function `toSessionResponse` at the top of `routes.ts`. Every endpoint that uses it then gets `seatsLeft`. `countRegistrations(sessionId)` counts the registrations.

</details>

### 7. Fully booked

When all seats are taken, a new registration should respond `409` with `SESSION_FULL`.

<details>
<summary>Hint</summary>

Check this in the POST handler from task 4, before calling `createRegistration`.

</details>

### 8. Duplicate registration

If the same email address is already registered for the session, the response should be `409 ALREADY_REGISTERED`.

<details>
<summary>Hint</summary>

`listRegistrationsByEmail(email)` gives every registration for an email address. Is there one with the same `sessionId`?

</details>

### 9. Schedule conflict

You can't be in two places at once. If the email address is already registered for a session that overlaps in time, the response should be `409 SCHEDULE_CONFLICT`. A session that ends at 11:00 does **not** conflict with one that starts at 11:00.

<details>
<summary>Hint 1</summary>

Get the person's other registrations with `listRegistrationsByEmail(email)` and look up each session with `getSession`.

</details>

<details>
<summary>Hint 2: the overlap formula</summary>

Two time intervals A and B overlap if:

```ts
a.startsAt < b.endsAt && b.startsAt < a.endsAt
```

The times have the format `"2026-11-20T10:00"`, so they can be compared directly as strings.

</details>

## Bonus

Done with everything? Pick any:

- **Cancellation:** `DELETE /api/registrations/:id` (`deleteRegistration` already exists in the store).
- **Personal agenda:** `GET /api/attendees/:email/sessions` returns every session a person is registered for, sorted by time.
- **Filtering:** `GET /api/sessions?room=Room%20A` and `?speaker=…`.
- **Room conflict:** `POST` and `PATCH` on sessions should respond `409 ROOM_CONFLICT` if the room is already taken.
- **Waiting list:** when a session is full, you end up on a waiting list. When someone cancels, the first person in line gets the seat.
- **SQLite:** replace the in-memory data in `store.ts` with `node:sqlite` (Node 22.5+) so the data survives a restart.

## Solution

A suggested solution will be published on the `solution` branch after the workshop.

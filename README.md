# API workshop: Conference API

The goal of this web app is to represent the agenda for a conference. The conference includes different sessions in different rooms, and visitors can register for them.

The frontend is done, but several endpoints in the API are missing. Your job is to build them!

The stack is Express, TypeScript and [Zod](https://zod.dev) for validation. Feel free to read more about this stack online!

**You will only need to work in one file: [`server/src/routes.ts`](server/src/routes.ts)** (except for in [`server/src/schemas.ts`](server/src/schemas.ts) which is needed in task 4).


## Goal of the exercise

Your goal is to try to complete as many tasks as you can, to make the website completely functioning!

- After doing tasks 1 to 6, the whole frontend will be working. 
- Task 7 to 9 add additional business logic.
- If you want, you can then pick some bonus tasks in the [bonus](#bonus) category!

The tasks are **independent of each other**. If you are stuck or if you think another task is more fun, feel free to skip between them! (Exception: tasks 7–9 build on the endpoint from task 4.)

## Getting started

### Run the project locally

From the terminal:

```sh
# No git? Open https://github.com/evkade/api-workshop.git in your browser, click **Code → Download ZIP** and unzip it instead of doing the first step here. 
git clone https://github.com/evkade/api-workshop.git 
cd api-workshop
npm install
npm run dev
```

Then open <http://localhost:3000> in your browser and run `npm run test:watch` in a second terminal.

### Good to know

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the server on port 3000. It serves both the API and the frontend. Restarts when you save a server file. |
| `npm run test:watch` | Runs the tests and reruns them when you save. Watch the tasks turn green! |
| `npm test` | Runs the tests once. |

- The data lives in memory and is reset when the server restarts.
- Try the endpoints with `curl` or the frontend. Add `-i` to `curl` to see the status code:

  ```bash
  # List all sessions
  curl http://localhost:3000/api/sessions

  # Create a session
  curl -X POST http://localhost:3000/api/sessions \
    -H "Content-Type: application/json" \
    -d '{"title":"My own session","speaker":"Kim Larsson","room":"Room B","startsAt":"2026-11-20T15:00","endsAt":"2026-11-20T15:45","capacity":10}'

  # Task 1: get one session
  curl -i http://localhost:3000/api/sessions/s1
  ```
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
```

There is only one server, on port 3000. It answers requests to `/api/…` with the API and sends the frontend files from `client/` for everything else. That is why `npm run dev` is the only thing you need to start.

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

Done with everything? Pick any of the following!

- **Cancellation:** `DELETE /api/registrations/:id` (`deleteRegistration` already exists in the store).
- **Personal agenda:** `GET /api/attendees/:email/sessions` returns every session a person is registered for, sorted by time.
- **Filtering:** `GET /api/sessions?room=Room%20A` and `?speaker=…`.
- **Room conflict:** `POST` and `PATCH` on sessions should respond `409 ROOM_CONFLICT` if the room is already taken.
- **Waiting list:** when a session is full, you end up on a waiting list. When someone cancels, the first person in line gets the seat.
- **SQLite:** replace the in-memory data in `store.ts` with `node:sqlite` (Node 22.5+) so the data survives a restart.

## More technical information

Optional reading for those who want to know more about how the project works. You don't need any of this to do the tasks!

### What happens to a request

`server/src/app.ts` sets up the Express app. A request goes through these steps in order:

1. `express.json()` reads a JSON body and puts it in `req.body`. A body that is not valid JSON gives `400 INVALID_JSON`.
2. `express.static` sends files from `client/` when the URL matches one, for example `/` or `/app.js`.
3. The router in `routes.ts` handles the API endpoints.
4. A request to `/api/…` that no route matched gives `404 NOT_FOUND`.
5. If a handler throws an error, the error handler logs it in the terminal and responds `500 INTERNAL_ERROR`.

### TypeScript without a build step

[tsx](https://tsx.is) runs the `.ts` files directly, so there is no compile step and no `dist/` folder. `tsconfig.json` has `noEmit: true`: it is only used by your editor to check types. That is also why the imports end in `.ts`.

### Validation with Zod

The schemas in `schemas.ts` describe what a valid body looks like. `schema.safeParse(req.body)` never throws. It returns either `{ success: true, data }` with the parsed data, or `{ success: false, error }`. `sendValidationError` turns Zod's error into a list of the fields that failed:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "The request contains invalid data",
  "details": [{ "path": "capacity", "message": "Too small: expected number to be >0" }]
}
```

### The data

`store.ts` keeps sessions and registrations in two plain arrays. New ids are counted up (`s9`, `s10`, …), and `resetStore()` puts back the seed data. Nothing is written to disk.

### The tests

The tests use Node's built-in test runner (`node:test`), so there is no Jest or Vitest to install. For each test file, `useTestServer()` in `server/tests/helpers.ts`:

- starts the app on a free port (`listen(0)`), so the tests never collide with your `npm run dev` server,
- resets the data before every test, so the tests don't affect each other,
- sends real HTTP requests with `fetch`, so a test checks the same thing a browser or `curl` would.

When a test fails, the message says what was expected in plain words, for example that an endpoint still responds `501` because the task is not done yet.

### The frontend

`client/` is plain HTML, CSS and JavaScript with no framework and no build step. `app.js` calls the same `/api/…` endpoints with `fetch`, so every endpoint you finish shows up in the page.

## Solution

A suggested solution will be published on the `solution` branch after the workshop :)

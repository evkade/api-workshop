# Tech stack

What the project is built with, and where each part lives. You don't need any of this to do the tasks, but it helps to know what you are working with.

| Part              | What it is                                   | Where it lives                              |
| ----------------- | -------------------------------------------- | ------------------------------------------- |
| Runtime           | [Node.js](https://nodejs.org) 20.6 or later  | `package.json` (`engines`)                  |
| Web framework     | [Express](https://expressjs.com) 5           | `server/src/app.ts`, `server/src/routes.ts` |
| Validation        | [Zod](https://zod.dev) 4                     | `server/src/schemas.ts`                     |
| Language          | [TypeScript](https://www.typescriptlang.org) | `server/`, configured in `tsconfig.json`    |
| TypeScript runner | [tsx](https://tsx.is)                        | `package.json` (`scripts`)                  |
| Tests             | Node's built-in test runner (`node:test`)    | `server/tests/`                             |
| Data              | In-memory arrays, no database                | `server/src/store.ts`                       |
| Frontend          | Plain HTML, CSS and JavaScript, no framework | `client/`                                   |

## Runtime: Node.js

The project needs Node 20.6 or later. That is the first version that supports `node --import`, which the test scripts use to load TypeScript. npm comes with Node.

The project uses ES modules (`"type": "module"` in `package.json`), so the files use `import` and `export` instead of `require`.

## Web framework: Express 5

Express handles everything HTTP:

- **Routing:** `router.get("/api/sessions/:id", …)` in `routes.ts`. Path parameters like `:id` end up in `req.params`.
- **Middleware:** `app.ts` sets up `express.json()`, which reads JSON bodies into `req.body`, and `express.static`, which serves the frontend from `client/`. It also adds a `404 NOT_FOUND` handler for unknown `/api/…` routes and an error handler for `400 INVALID_JSON` and `500 INTERNAL_ERROR`.
- **Responses:** `res.status(201).json(…)` sends JSON with a status code, and `res.status(204).end()` sends a response without a body.

Express 5 is fairly new, and many tutorials are written for Express 4. Everything you need for the tasks (`req.params`, `req.body`, `res.status().json()`) works the same in both.

## Validation: Zod 4

Zod checks that a request body has the right shape before the API uses it. The schemas live in `schemas.ts`, and a route uses them like this:

```ts
const result = sessionSchema.safeParse(req.body)
if (!result.success) return sendValidationError(res, result.error)
// result.data is now valid
```

`safeParse` never throws. It returns either `{ success: true, data }` or `{ success: false, error }`. `sendValidationError` in `errors.ts` turns the error into a `400 VALIDATION_ERROR` response.

Zod 4 has some new syntax compared to Zod 3: `z.email()` instead of `z.string().email()`, and `z.iso.datetime()` for dates and times. The old style still works.

## Language: TypeScript, run with tsx

The server is written in TypeScript with `strict` mode on. There is no build step: tsx runs the `.ts` files directly.

- `npm run dev` uses `tsx watch`, which restarts the server when you save a file.
- tsx removes the types without checking them, so a type error does not stop the server. Your editor shows type errors using `tsconfig.json`. That is why `tsconfig.json` has `noEmit: true`: it is only used for checking, never for building.
- The imports end in `.ts` (for example `import { router } from "./routes.ts"`), which `allowImportingTsExtensions` allows.

## Tests: Node's built-in test runner

There is no Jest or Vitest. The tests use `node:test` and `node:assert`, which come with Node.

- There is one test file per task, from `01-get-session.test.ts` to `09-schedule-conflict.test.ts`. `all.ts` loads them all.
- `helpers.ts` starts the real app on a free port, so the tests never collide with your `npm run dev` server. It resets the data before every test and sends real HTTP requests with `fetch`.
- When a test fails, the message explains what was expected in plain words.

## Data: in memory

There is no database. `store.ts` keeps sessions and registrations in two arrays, filled with seed data when the server starts. Everything you change is lost when the server restarts.

All the functions to read and change the data already exist, for example `getSession(id)` and `createRegistration(sessionId, { name, email })`. Your job is the HTTP part.

## Frontend: plain HTML, CSS and JavaScript

`client/` has no framework and no build step:

- `index.html`: the page
- `styles.css`: the styles
- `app.js`: calls the API with `fetch` and builds the schedule. The `api()` function at the top wraps every request.

Express serves the frontend on the same port as the API (3000), so there is only one thing to start.

## Tooling

- **Prettier:** `.prettierrc` sets the code style (no semicolons, lines up to 120 characters). Prettier is not installed with the project. Use the Prettier extension in your editor, or run `npx prettier --write .`.
- **Types:** `@types/express` and `@types/node` give your editor the types for Express and Node. They don't change how the code runs.

## How this compares to a bigger project

A larger Express project usually splits the server into folders like `routes/`, `controllers/`, `services/` and `middleware/`. This project keeps it flat on purpose, so you only need to open one file:

| Usually                      | In this project                                     |
| ---------------------------- | --------------------------------------------------- |
| `routes/`                    | `routes.ts`                                         |
| `controllers/`               | The handlers inside `routes.ts`                     |
| `services/` (business logic) | The rules in `routes.ts` (tasks 7–9) and `store.ts` |
| `models/` or a database      | `store.ts`                                          |
| Validation                   | `schemas.ts`                                        |
| `middleware/`                | `app.ts` and `errors.ts`                            |
| `index.ts`                   | `server.ts` starts the app, `app.ts` creates it     |

There is also no authentication: anyone can create, change or delete sessions.

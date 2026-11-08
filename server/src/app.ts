import express, { type NextFunction, type Request, type Response } from "express"
import { fileURLToPath } from "node:url"
import { sendError } from "./errors.ts"
import { router } from "./routes.ts"

const clientDir = fileURLToPath(new URL("../../client", import.meta.url))

export function createApp() {
  const app = express()
  app.use(express.json())
  app.use(express.static(clientDir))
  app.use(router)

  app.use("/api", (req: Request, res: Response) => {
    sendError(res, 404, "NOT_FOUND", `There is no endpoint for ${req.method} ${req.originalUrl}`)
  })

  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof SyntaxError) {
      sendError(res, 400, "INVALID_JSON", "The body is not valid JSON")
      return
    }
    console.error(error)
    sendError(res, 500, "INTERNAL_ERROR", "Something went wrong in the server, check the terminal")
  })

  return app
}

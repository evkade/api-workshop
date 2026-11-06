import { z } from "zod"

const localDateTime = z.iso.datetime({ local: true })

const sessionFields = z.object({
  title: z.string().trim().min(1),
  speaker: z.string().trim().min(1),
  room: z.string().trim().min(1),
  startsAt: localDateTime,
  endsAt: localDateTime,
  capacity: z.number().int().positive(),
})

export const sessionSchema = sessionFields.refine((session) => session.startsAt < session.endsAt, {
  message: "endsAt must be after startsAt",
  path: ["endsAt"],
})

/** Like sessionSchema, but every field is optional. Used by PATCH (task 3). */
export const sessionPatchSchema = sessionFields.partial()

// ─── Task 4 ────────────────────────────────────────────────
// TODO: Write the schema for a registration.
// • name: a non-empty string
// • email: a valid email address (in Zod 4: z.email())
export const registrationSchema = z.object({})

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

const endsAfterStart = {
  check: (session: { startsAt?: string; endsAt?: string }) =>
    session.startsAt === undefined || session.endsAt === undefined || session.startsAt < session.endsAt,
  error: { message: "endsAt must be after startsAt", path: ["endsAt"] },
}

export const sessionSchema = sessionFields.refine(endsAfterStart.check, endsAfterStart.error)

/** Like sessionSchema, but every field is optional. Used by PATCH (task 3). */
export const sessionPatchSchema = sessionFields.partial().refine(endsAfterStart.check, endsAfterStart.error)

// ─── Task 4 ────────────────────────────────────────────────
export const registrationSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
})

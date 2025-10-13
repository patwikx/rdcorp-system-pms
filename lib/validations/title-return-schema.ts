import { z } from "zod"

export const TitleReturnSchema = z.object({
  movementId: z
    .string()
    .min(1, { message: "Movement ID is required" }),
  returnedBy: z
    .string()
    .min(1, { message: "Returned by is required" })
    .max(200, { message: "Returned by must be less than 200 characters" }),
  receivedByOnReturn: z
    .string()
    .min(1, { message: "Received by (on return) is required" })
    .max(200, { message: "Received by must be less than 200 characters" }),
  returnDate: z
    .date({
      message: "Return date is required",
    }),
  returnCondition: z
    .enum(["GOOD", "FAIR", "POOR", "DAMAGED"], {
      message: "Please select a valid condition",
    }),
  returnNotes: z
    .string()
    .max(1000, { message: "Notes must be less than 1000 characters" })
    .optional(),
  documentsComplete: z
    .boolean()
    .refine(val => val === true, {
      message: "Please confirm all documents are complete",
    }),
  titleIntact: z
    .boolean()
    .refine(val => val === true, {
      message: "Please confirm the title is intact",
    }),
})

export type TitleReturnFormData = z.infer<typeof TitleReturnSchema>
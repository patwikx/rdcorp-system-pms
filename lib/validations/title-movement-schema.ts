import { z } from "zod"
import { MovementStatus, Priority } from "@prisma/client"

export const TitleMovementSchema = z.object({
  propertyId: z
    .string()
    .min(1, { message: "Property ID is required" }),
  purposeOfRelease: z
    .string()
    .min(1, { message: "Purpose of release is required" })
    .max(1000, { message: "Purpose must be less than 1000 characters" }),
  releasedBy: z
    .string()
    .min(1, { message: "Released by is required" })
    .max(200, { message: "Released by must be less than 200 characters" }),
  approvedById: z
    .string()
    .min(1, { message: "Approver is required" }),
  receivedByTransmittal: z
    .string()
    .min(1, { message: "Transmittal number is required" })
    .max(200, { message: "Transmittal must be less than 200 characters" }),
  receivedByName: z
    .string()
    .min(1, { message: "Received by name is required" })
    .max(200, { message: "Received by name must be less than 200 characters" }),
})

export const TitleMovementUpdateSchema = z.object({
  id: z.string().min(1, { message: "Movement ID is required" }),
  movementStatus: z.nativeEnum(MovementStatus, {
    message: "Please select a valid movement status",
  }),
  receivedByTransmittal: z
    .string()
    .max(200, { message: "Transmittal must be less than 200 characters" })
    .optional(),
  receivedByName: z
    .string()
    .max(200, { message: "Received by name must be less than 200 characters" })
    .optional(),
  turnedOverBy: z
    .string()
    .max(200, { message: "Turned over by must be less than 200 characters" })
    .optional(),
  receivedByPerson: z
    .string()
    .max(200, { message: "Received by person must be less than 200 characters" })
    .optional(),
  returnedBy: z
    .string()
    .max(200, { message: "Returned by must be less than 200 characters" })
    .optional(),
  receivedByOnReturn: z
    .string()
    .max(200, { message: "Received by on return must be less than 200 characters" })
    .optional(),
})

export const ApprovalWorkflowSchema = z.object({
  propertyId: z
    .string()
    .min(1, { message: "Property ID is required" }),
  description: z
    .string()
    .min(1, { message: "Description is required" })
    .max(1000, { message: "Description must be less than 1000 characters" }),
  priority: z.nativeEnum(Priority, {
    message: "Please select a valid priority",
  }).default(Priority.NORMAL),
  proposedChanges: z.record(z.string(), z.unknown()),
})

export const ApprovalDecisionSchema = z.object({
  id: z.string().min(1, { message: "Workflow ID is required" }),
  decision: z.enum(["APPROVED", "REJECTED"], {
    message: "Please select approve or reject",
  }),
  rejectedReason: z
    .string()
    .max(1000, { message: "Reason must be less than 1000 characters" })
    .optional(),
})

export type TitleMovementFormData = z.infer<typeof TitleMovementSchema>
export type TitleMovementUpdateData = z.infer<typeof TitleMovementUpdateSchema>
export type ApprovalWorkflowFormData = z.infer<typeof ApprovalWorkflowSchema>
export type ApprovalDecisionData = z.infer<typeof ApprovalDecisionSchema>
import { z } from "zod"

// Validation schemas
export const CreateRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100, "Role name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  permissionIds: z.array(z.string()),
})

export const UpdateRoleSchema = z.object({
  id: z.string().min(1, "Role ID is required"),
  name: z.string().min(1, "Role name is required").max(100, "Role name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  isActive: z.boolean().optional(),
  permissionIds: z.array(z.string()),
})

export type CreateRoleData = z.infer<typeof CreateRoleSchema>
export type UpdateRoleData = z.infer<typeof UpdateRoleSchema>
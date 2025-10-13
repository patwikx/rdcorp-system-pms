import { z } from "zod"

// Validation schemas
export const CreateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleId: z.string().min(1, "Role is required"),
  department: z.string().max(100, "Department must be less than 100 characters").optional(),
  position: z.string().max(100, "Position must be less than 100 characters").optional(),
})

export const UpdateUserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
  email: z.string().email("Invalid email address"),
  roleId: z.string().min(1, "Role is required"),
  department: z.string().max(100, "Department must be less than 100 characters").optional(),
  position: z.string().max(100, "Position must be less than 100 characters").optional(),
  isActive: z.boolean().optional(),
})

export type CreateUserData = z.infer<typeof CreateUserSchema>
export type UpdateUserData = z.infer<typeof UpdateUserSchema>
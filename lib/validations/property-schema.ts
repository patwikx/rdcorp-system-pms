import { z } from "zod"
import { PropertyClassification, PropertyStatus } from "@prisma/client"

export const PropertySchema = z.object({
  titleNumber: z
    .string()
    .min(1, { message: "Title number is required" })
    .max(100, { message: "Title number must be less than 100 characters" }),
  lotNumber: z
    .string()
    .min(1, { message: "Lot number is required" })
    .max(100, { message: "Lot number must be less than 100 characters" }),
  lotArea: z
    .number()
    .min(0.01, { message: "Lot area must be greater than 0" })
    .max(999999999.99, { message: "Lot area is too large" }),
  location: z
    .string()
    .max(500, { message: "Location must be less than 500 characters" })
    .optional(),
  barangay: z
    .string()
    .min(1, { message: "Barangay is required" })
    .max(100, { message: "Barangay must be less than 100 characters" }),
  city: z
    .string()
    .min(1, { message: "City is required" })
    .max(100, { message: "City must be less than 100 characters" }),
  province: z
    .string()
    .min(1, { message: "Province is required" })
    .max(100, { message: "Province must be less than 100 characters" }),
  zipCode: z
    .string()
    .max(10, { message: "Zip code must be less than 10 characters" })
    .optional(),
  description: z
    .string()
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional(),
  classification: z.nativeEnum(PropertyClassification, {
    message: "Please select a valid property classification",
  }),
  status: z.nativeEnum(PropertyStatus, {
    message: "Please select a valid property status",
  }).default(PropertyStatus.ACTIVE),
  registeredOwner: z
    .string()
    .min(1, { message: "Registered owner is required" })
    .max(200, { message: "Registered owner must be less than 200 characters" }),
  bank: z
    .string()
    .max(100, { message: "Bank must be less than 100 characters" })
    .optional(),
  custodyOfTitle: z
    .string()
    .max(200, { message: "Custody of title must be less than 200 characters" })
    .optional(),
  encumbrance: z
    .string()
    .max(1000, { message: "Encumbrance must be less than 1000 characters" })
    .optional(),
  mortgageDetails: z
    .string()
    .max(1000, { message: "Mortgage details must be less than 1000 characters" })
    .optional(),
  borrowerMortgagor: z
    .string()
    .max(200, { message: "Borrower/Mortgagor must be less than 200 characters" })
    .optional(),
  taxDeclaration: z
    .string()
    .max(100, { message: "Tax declaration must be less than 100 characters" })
    .optional(),
  remarks: z
    .string()
    .max(1000, { message: "Remarks must be less than 1000 characters" })
    .optional(),
})

export const PropertyUpdateSchema = PropertySchema.partial().extend({
  id: z.string().min(1, { message: "Property ID is required" }),
})

export type PropertyFormData = z.infer<typeof PropertySchema>
export type PropertyUpdateData = z.infer<typeof PropertyUpdateSchema>
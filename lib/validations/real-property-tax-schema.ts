import { z } from "zod"
import { TaxStatus, PaymentMethod } from "@prisma/client"

export const RealPropertyTaxSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  taxYear: z.number().int().min(1900, "Invalid tax year").max(new Date().getFullYear() + 1, "Tax year cannot be in the future"),
  taxQuarter: z.number().int().min(1).max(4).nullable().optional(),
  taxAmount: z.number().min(0, "Tax amount must be positive"),
  dueDate: z.date(),
  periodFrom: z.date(),
  periodTo: z.date(),
  status: z.nativeEnum(TaxStatus),
  notes: z.string().optional(),
})

export const RealPropertyTaxUpdateSchema = RealPropertyTaxSchema.extend({
  id: z.string().min(1, "Tax record ID is required"),
}).partial().extend({
  id: z.string().min(1, "Tax record ID is required"),
})

export const RealPropertyTaxPaymentSchema = z.object({
  id: z.string().min(1, "Tax record ID is required"),
  amountPaid: z.number().min(0, "Amount paid must be positive"),
  paymentDate: z.date(),
  officialReceiptNumber: z.string().min(1, "Receipt number is required"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  discount: z.number().min(0).optional().nullable(),
  penalty: z.number().min(0).optional().nullable(),
  interest: z.number().min(0).optional().nullable(),
  notes: z.string().optional(),
})

export type RealPropertyTaxFormData = z.infer<typeof RealPropertyTaxSchema>
export type RealPropertyTaxUpdateData = z.infer<typeof RealPropertyTaxUpdateSchema>
export type RealPropertyTaxPaymentData = z.infer<typeof RealPropertyTaxPaymentSchema>
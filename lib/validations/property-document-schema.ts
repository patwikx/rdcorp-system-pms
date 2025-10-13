import { z } from "zod"
import { DocumentType } from "@prisma/client"

export const PropertyDocumentSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  documentType: z.nativeEnum(DocumentType),
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().url("Invalid file URL"),
  fileSize: z.number().int().min(0).optional().nullable(),
  mimeType: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

export const PropertyDocumentUpdateSchema = PropertyDocumentSchema.extend({
  id: z.string().min(1, "Document ID is required"),
}).partial().extend({
  id: z.string().min(1, "Document ID is required"),
})

export type PropertyDocumentFormData = z.infer<typeof PropertyDocumentSchema>
export type PropertyDocumentUpdateData = z.infer<typeof PropertyDocumentUpdateSchema>
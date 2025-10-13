"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { 
  PropertyDocumentSchema, 
  PropertyDocumentUpdateSchema,
  type PropertyDocumentFormData, 
  type PropertyDocumentUpdateData
} from "@/lib/validations/property-document-schema"
import { PropertyDocument } from "@prisma/client"

export type ActionResult<T = unknown> = {
  error?: string
  success?: boolean
  data?: T
  details?: Record<string, unknown>
}

export async function createPropertyDocument(data: PropertyDocumentFormData): Promise<ActionResult<PropertyDocument>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = PropertyDocumentSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
        details: validatedData.error.format(),
      }
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: validatedData.data.propertyId },
    })

    if (!property) {
      return { error: "Property not found" }
    }

    const document = await prisma.propertyDocument.create({
      data: validatedData.data,
    })

    revalidatePath(`/properties/${validatedData.data.propertyId}`)
    return { success: true, data: document }
  } catch (error) {
    console.error("Error creating property document:", error)
    return { error: "Failed to create document" }
  }
}

export async function updatePropertyDocument(data: PropertyDocumentUpdateData): Promise<ActionResult<PropertyDocument>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = PropertyDocumentUpdateSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
        details: validatedData.error.format(),
      }
    }

    const { id, ...updateData } = validatedData.data

    // Check if document exists
    const existingDocument = await prisma.propertyDocument.findUnique({
      where: { id },
    })

    if (!existingDocument) {
      return { error: "Document not found" }
    }

    const document = await prisma.propertyDocument.update({
      where: { id },
      data: updateData,
    })

    revalidatePath(`/properties/${existingDocument.propertyId}`)
    return { success: true, data: document }
  } catch (error) {
    console.error("Error updating property document:", error)
    return { error: "Failed to update document" }
  }
}

export async function deletePropertyDocument(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    // Check if document exists
    const existingDocument = await prisma.propertyDocument.findUnique({
      where: { id },
    })

    if (!existingDocument) {
      return { error: "Document not found" }
    }

    // Soft delete by setting isActive to false
    await prisma.propertyDocument.update({
      where: { id },
      data: { isActive: false },
    })

    revalidatePath(`/properties/${existingDocument.propertyId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting property document:", error)
    return { error: "Failed to delete document" }
  }
}

export async function getPropertyDocument(id: string): Promise<PropertyDocument | null> {
  try {
    const document = await prisma.propertyDocument.findUnique({
      where: { 
        id,
        isActive: true,
      },
    })

    return document
  } catch (error) {
    console.error("Error fetching property document:", error)
    return null
  }
}

export async function getDocumentDownloadUrl(id: string): Promise<ActionResult<{ url: string; fileName: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const document = await prisma.propertyDocument.findUnique({
      where: { 
        id,
        isActive: true,
      },
    })

    if (!document) {
      return { error: "Document not found" }
    }

    // Return the file URL and name for download
    return { 
      success: true, 
      data: { 
        url: document.fileUrl, 
        fileName: document.fileName 
      } 
    }
  } catch (error) {
    console.error("Error getting document download URL:", error)
    return { error: "Failed to get download URL" }
  }
}

export async function getDocumentViewUrl(id: string): Promise<ActionResult<{ url: string; fileName: string; mimeType: string | null }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const document = await prisma.propertyDocument.findUnique({
      where: { 
        id,
        isActive: true,
      },
    })

    if (!document) {
      return { error: "Document not found" }
    }

    // Return the file URL, name, and mime type for viewing
    return { 
      success: true, 
      data: { 
        url: document.fileUrl, 
        fileName: document.fileName,
        mimeType: document.mimeType
      } 
    }
  } catch (error) {
    console.error("Error getting document view URL:", error)
    return { error: "Failed to get view URL" }
  }
}
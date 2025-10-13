"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PropertySchema, PropertyUpdateSchema, type PropertyFormData, type PropertyUpdateData } from "@/lib/validations/property-schema"
import { Property, PropertyClassification, PropertyStatus, Prisma, ChangeType, WorkflowType, ApprovalStatus, Priority } from "@prisma/client"

export type PropertyWithDetails = Omit<Property, 'lotArea'> & {
  lotArea: number
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
  updatedBy: {
    id: string
    firstName: string
    lastName: string
  } | null
  _count: {
    titleMovements: number
    approvalWorkflows: number
    changeHistories: number
    documents: number
    realPropertyTaxes: number
  }
}

export type PropertyWithFullDetails = Omit<Property, 'lotArea'> & {
  lotArea: number
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
  updatedBy: {
    id: string
    firstName: string
    lastName: string
  } | null
  realPropertyTaxes: Array<{
    id: string
    propertyId: string
    taxYear: number
    taxQuarter: number | null
    taxAmount: number
    isPaid: boolean
    amountPaid: number | null
    paymentDate: Date | null
    officialReceiptNumber: string | null
    paymentMethod: string | null
    discount: number | null
    penalty: number | null
    interest: number | null
    dueDate: Date
    periodFrom: Date
    periodTo: Date
    status: string
    notes: string | null
    attachmentUrl: string | null
    createdAt: Date
    updatedAt: Date
    recordedById: string
  }>
  titleMovements: Array<{
    id: string
    propertyId: string
    dateReleased: Date | null
    releasedBy: string | null
    purposeOfRelease: string | null
    approvedBy: string | null
    receivedByTransmittal: string | null
    receivedByName: string | null
    turnedOverDate: Date | null
    turnedOverBy: string | null
    receivedByPerson: string | null
    dateReturned: Date | null
    returnedBy: string | null
    receivedByOnReturn: string | null
    movementStatus: string
    createdAt: Date
    updatedAt: Date
    movedById: string
    movedBy: {
      id: string
      firstName: string
      lastName: string
    }
  }>
  documents: Array<{
    id: string
    propertyId: string
    documentType: string
    fileName: string
    fileUrl: string
    fileSize: number | null
    mimeType: string | null
    description: string | null
    uploadedAt: Date
    isActive: boolean
  }>
  approvalWorkflows: Array<{
    id: string
    propertyId: string
    workflowType: string
    description: string
    status: string
    priority: string
    proposedChanges: Prisma.JsonValue
    initiatedById: string
    approvedById: string | null
    approvedAt: Date | null
    rejectedReason: string | null
    createdAt: Date
    updatedAt: Date
    initiatedBy: {
      id: string
      firstName: string
      lastName: string
    }
    approvedBy: {
      id: string
      firstName: string
      lastName: string
    } | null
  }>
  changeHistories: Array<{
    id: string
    propertyId: string
    fieldName: string
    oldValue: string | null
    newValue: string | null
    changeType: string
    changedAt: Date
    reason: string | null
    changedById: string
    changedBy: {
      id: string
      firstName: string
      lastName: string
    }
  }>
  _count: {
    titleMovements: number
    approvalWorkflows: number
    changeHistories: number
    documents: number
    realPropertyTaxes: number
  }
}

export type ActionResult<T = unknown> = {
  error?: string
  success?: boolean
  data?: T
  details?: Record<string, unknown>
}

export async function createProperty(data: PropertyFormData): Promise<ActionResult<Property>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = PropertySchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
        details: validatedData.error.format(),
      }
    }

    // Check if title number already exists
    const existingProperty = await prisma.property.findUnique({
      where: { titleNumber: validatedData.data.titleNumber },
    })

    if (existingProperty) {
      return { error: "A property with this title number already exists" }
    }

    // Use a transaction to create property and change history
    const result = await prisma.$transaction(async (tx) => {
      // Create the property
      const property = await tx.property.create({
        data: {
          ...validatedData.data,
          createdById: session.user.id,
        },
      })

      // Create change history record for property creation
      await tx.changeHistory.create({
        data: {
          propertyId: property.id,
          fieldName: 'property',
          oldValue: null,
          newValue: 'Property created',
          changeType: ChangeType.CREATE,
          changedById: session.user.id,
          reason: 'New property record created',
        },
      })

      return property
    })

    revalidatePath("/properties")
    return { success: true, data: result }
  } catch (error) {
    console.error("Error creating property:", error)
    return { error: "Failed to create property" }
  }
}

export async function requestPropertyUpdate(data: PropertyUpdateData): Promise<ActionResult<{ workflowId: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = PropertyUpdateSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
        details: validatedData.error.format(),
      }
    }

    const { id, ...updateData } = validatedData.data

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    })

    if (!existingProperty) {
      return { error: "Property not found" }
    }

    // Check if title number is being changed and if it already exists
    if (updateData.titleNumber && updateData.titleNumber !== existingProperty.titleNumber) {
      const titleExists = await prisma.property.findUnique({
        where: { titleNumber: updateData.titleNumber },
      })

      if (titleExists) {
        return { error: "A property with this title number already exists" }
      }
    }

    // Helper function to compare values properly handling different data types
    const valuesAreEqual = (oldValue: unknown, newValue: unknown): boolean => {
      // Handle null/undefined cases
      if (oldValue === null || oldValue === undefined) {
        return newValue === null || newValue === undefined || newValue === ''
      }
      if (newValue === null || newValue === undefined) {
        return oldValue === null || oldValue === undefined || oldValue === ''
      }

      // Handle Prisma Decimal objects
      if (typeof oldValue === 'object' && oldValue !== null && 'toString' in oldValue) {
        const oldNum = Number(oldValue)
        const newNum = Number(newValue)
        if (!isNaN(oldNum) && !isNaN(newNum)) {
          return oldNum === newNum
        }
      }

      // Handle numeric comparisons
      if (typeof oldValue === 'number' || typeof newValue === 'number') {
        const oldNum = Number(oldValue)
        const newNum = Number(newValue)
        if (!isNaN(oldNum) && !isNaN(newNum)) {
          return oldNum === newNum
        }
      }

      // Handle string comparisons (trim whitespace)
      if (typeof oldValue === 'string' && typeof newValue === 'string') {
        return oldValue.trim() === newValue.trim()
      }

      // Default comparison
      return oldValue === newValue
    }

    // Create comparison data showing only changed fields
    const changes: Record<string, { oldValue: unknown; newValue: unknown; fieldName: string }> = {}
    
    for (const [fieldName, newValue] of Object.entries(updateData)) {
      const oldValue = existingProperty[fieldName as keyof typeof existingProperty]
      
      // Check if values are actually different
      const areEqual = valuesAreEqual(oldValue, newValue)
      
      // Debug logging to understand what's being compared
      if (fieldName === 'lotArea') {
        console.log('Lot Area Comparison:', {
          fieldName,
          oldValue,
          newValue,
          oldValueType: typeof oldValue,
          newValueType: typeof newValue,
          areEqual
        })
      }
      
      // Only include fields that are actually changing
      if (!areEqual) {
        changes[fieldName] = {
          oldValue,
          newValue,
          fieldName: fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
        }
      }
    }

    // Create approval workflow with comparison data
    const workflow = await prisma.approvalWorkflow.create({
      data: {
        propertyId: id,
        workflowType: WorkflowType.PROPERTY_UPDATE,
        description: `Update ${Object.keys(changes).length} field(s): ${Object.values(changes).map(c => c.fieldName).join(', ')}`,
        status: ApprovalStatus.PENDING,
        priority: Priority.NORMAL,
        proposedChanges: changes as Prisma.InputJsonValue,
        initiatedById: session.user.id,
      },
    })

    revalidatePath("/properties")
    revalidatePath(`/properties/${id}`)
    revalidatePath("/approvals")
    
    return { 
      success: true, 
      data: { workflowId: workflow.id },
      details: { message: "Property update request submitted for approval" }
    }
  } catch (error) {
    console.error("Error requesting property update:", error)
    return { error: "Failed to submit property update request" }
  }
}

export async function updateProperty(data: PropertyUpdateData): Promise<ActionResult<Property>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = PropertyUpdateSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
        details: validatedData.error.format(),
      }
    }

    const { id, ...updateData } = validatedData.data

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    })

    if (!existingProperty) {
      return { error: "Property not found" }
    }

    // Check if title number is being changed and if it already exists
    if (updateData.titleNumber && updateData.titleNumber !== existingProperty.titleNumber) {
      const titleExists = await prisma.property.findUnique({
        where: { titleNumber: updateData.titleNumber },
      })

      if (titleExists) {
        return { error: "A property with this title number already exists" }
      }
    }

    // Use a transaction to update property and create change history
    const result = await prisma.$transaction(async (tx) => {
      // Update the property
      const property = await tx.property.update({
        where: { id },
        data: {
          ...updateData,
          updatedById: session.user.id,
        },
      })

      // Create change history records for each changed field
      const changeHistoryPromises = []
      
      for (const [fieldName, newValue] of Object.entries(updateData)) {
        const oldValue = existingProperty[fieldName as keyof typeof existingProperty]
        
        // Only create change history if the value actually changed
        if (oldValue !== newValue) {
          changeHistoryPromises.push(
            tx.changeHistory.create({
              data: {
                propertyId: id,
                fieldName,
                oldValue: oldValue ? String(oldValue) : null,
                newValue: newValue ? String(newValue) : null,
                changeType: ChangeType.UPDATE,
                changedById: session.user.id,
                reason: 'Property information updated',
              },
            })
          )
        }
      }

      // Execute all change history creations
      if (changeHistoryPromises.length > 0) {
        await Promise.all(changeHistoryPromises)
      }

      return property
    })

    revalidatePath("/properties")
    revalidatePath(`/properties/${id}`)
    return { success: true, data: result }
  } catch (error) {
    console.error("Error updating property:", error)
    return { error: "Failed to update property" }
  }
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    })

    if (!existingProperty) {
      return { error: "Property not found" }
    }

    // Soft delete the property
    await prisma.property.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedById: session.user.id,
      },
    })

    revalidatePath("/properties")
    return { success: true }
  } catch (error) {
    console.error("Error deleting property:", error)
    return { error: "Failed to delete property" }
  }
}

export async function getProperty(id: string): Promise<PropertyWithDetails | null> {
  try {
    const property = await prisma.property.findUnique({
      where: { 
        id,
        isDeleted: false,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            titleMovements: true,
            approvalWorkflows: true,
            changeHistories: true,
            documents: true,
            realPropertyTaxes: true,
          },
        },
      },
    })

    if (!property) return null

    // Convert Decimal to number for client components
    return {
      ...property,
      lotArea: Number(property.lotArea),
    }
  } catch (error) {
    console.error("Error fetching property:", error)
    return null
  }
}

export async function getPropertyWithFullDetails(id: string): Promise<PropertyWithFullDetails | null> {
  try {
    const property = await prisma.property.findUnique({
      where: { 
        id,
        isDeleted: false,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        realPropertyTaxes: {
          orderBy: { taxYear: 'desc' },
        },
        titleMovements: {
          include: {
            movedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { dateReleased: 'desc' },
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        approvalWorkflows: {
          include: {
            initiatedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            approvedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        changeHistories: {
          include: {
            changedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { changedAt: 'desc' },
        },
        _count: {
          select: {
            titleMovements: true,
            approvalWorkflows: true,
            changeHistories: true,
            documents: true,
            realPropertyTaxes: true,
          },
        },
      },
    })

    if (!property) return null

    // Convert Decimal to number for client components
    const convertedProperty: PropertyWithFullDetails = {
      ...property,
      lotArea: Number(property.lotArea),
      realPropertyTaxes: property.realPropertyTaxes.map(tax => ({
        ...tax,
        taxAmount: Number(tax.taxAmount),
        amountPaid: tax.amountPaid ? Number(tax.amountPaid) : null,
        discount: tax.discount ? Number(tax.discount) : null,
        penalty: tax.penalty ? Number(tax.penalty) : null,
        interest: tax.interest ? Number(tax.interest) : null,
      })),
    }
    
    return convertedProperty
  } catch (error) {
    console.error("Error fetching property with full details:", error)
    return null
  }
}

export async function getProperties(params?: {
  search?: string
  classification?: PropertyClassification
  status?: PropertyStatus
  page?: number
  limit?: number
}): Promise<{
  properties: PropertyWithDetails[]
  totalCount: number
  totalPages: number
}> {
  try {
    const { search, classification, status, page = 1, limit = 10 } = params || {}
    const skip = (page - 1) * limit

    const where: Prisma.PropertyWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          { titleNumber: { contains: search, mode: "insensitive" } },
          { registeredOwner: { contains: search, mode: "insensitive" } },
          { lotNumber: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { barangay: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { province: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(classification && { classification }),
      ...(status && { status }),
    }

    const [propertiesRaw, totalCount] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              titleMovements: true,
              approvalWorkflows: true,
              changeHistories: true,
              documents: true,
              realPropertyTaxes: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ])

    // Convert Decimal to number for client components
    const properties = propertiesRaw.map(property => ({
      ...property,
      lotArea: Number(property.lotArea),
    }))

    const totalPages = Math.ceil(totalCount / limit)

    return {
      properties,
      totalCount,
      totalPages,
    }
  } catch (error) {
    console.error("Error fetching properties:", error)
    return {
      properties: [],
      totalCount: 0,
      totalPages: 0,
    }
  }
}
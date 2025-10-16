"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { 
  TitleMovementSchema, 
  TitleMovementUpdateSchema,
  ApprovalDecisionSchema,
  type TitleMovementFormData, 
  type TitleMovementUpdateData,
  type ApprovalDecisionData
} from "@/lib/validations/title-movement-schema"
import { 
  TitleReturnSchema,
  type TitleReturnFormData
} from "@/lib/validations/title-return-schema"
import { 
  TitleMovement, 
  ApprovalWorkflow, 
  MovementStatus, 
  WorkflowType, 
  ApprovalStatus,
  DocumentType,
  Prisma 
} from "@prisma/client"

export type TitleMovementWithDetails = TitleMovement & {
  property: {
    id: string
    titleNumber: string
    lotNumber: string
    lotArea: string
    location: string | null
    barangay: string
    city: string
    province: string
    zipCode: string | null
    description: string | null
    classification: string
    status: string
    registeredOwner: string
    bank: string | null
    custodyOfTitle: string | null
    encumbrance: string | null
    mortgageDetails: string | null
    borrowerMortgagor: string | null
    taxDeclaration: string | null
    remarks: string | null
  }
  movedBy: {
    id: string
    firstName: string
    lastName: string
  }
}

export type ApprovalWorkflowWithDetails = ApprovalWorkflow & {
  property: {
    id: string
    titleNumber: string
    location?: string | null
    registeredOwner: string
  }
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
}

export type TitleMovementWithPropertyDetails = TitleMovement & {
  property: {
    titleNumber: string
    lotNumber: string
    lotArea: string
    location: string | null
    barangay: string
    city: string
    province: string
    registeredOwner: string
    classification: string
  }
}

export type ActionResult<T = unknown> = {
  error?: string
  success?: boolean
  data?: T
  details?: Record<string, unknown>
}

export async function createAndApproveTitleMovement(
  data: TitleMovementFormData,
  uploadedFiles?: Array<{ fileName: string; name: string; fileUrl: string }>
): Promise<ActionResult<TitleMovementWithPropertyDetails>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = TitleMovementSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
        details: validatedData.error.flatten().fieldErrors,
      }
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: validatedData.data.propertyId },
      select: { id: true, custodyOfTitle: true }
    })

    if (!property) {
      return { error: "Property not found" }
    }

    // Check for existing pending title movement workflows for this property
    const existingPendingWorkflow = await prisma.approvalWorkflow.findFirst({
      where: {
        propertyId: validatedData.data.propertyId,
        workflowType: WorkflowType.TITLE_TRANSFER,
        status: ApprovalStatus.PENDING,
      },
      include: {
        initiatedBy: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    if (existingPendingWorkflow) {
      const initiatorName = `${existingPendingWorkflow.initiatedBy.firstName} ${existingPendingWorkflow.initiatedBy.lastName}`.trim()
      return { 
        error: `A title movement request is already pending approval for this property. Please wait for the current request (initiated by ${initiatorName}) to be processed before creating a new one.` 
      }
    }

    // Check for active title movements that are not yet returned
    const activeTitleMovement = await prisma.titleMovement.findFirst({
      where: {
        propertyId: validatedData.data.propertyId,
        movementStatus: {
          in: [MovementStatus.RELEASED, MovementStatus.IN_TRANSIT, MovementStatus.RECEIVED, MovementStatus.PENDING_RETURN]
        }
      }
    })

    if (activeTitleMovement) {
      const statusDisplay = activeTitleMovement.movementStatus.replace('_', ' ').toLowerCase()
      return { 
        error: `Cannot create new title movement. The property title is currently ${statusDisplay}. Please wait for the title to be returned before creating a new movement request.` 
      }
    }

    // Check if transmittal number is unique
    const existingTransmittal = await prisma.titleMovement.findFirst({
      where: { receivedByTransmittal: validatedData.data.receivedByTransmittal }
    })

    if (existingTransmittal) {
      return { error: "Transmittal number already exists. Please generate a new one." }
    }

    // Get the approver's name
    const approver = await prisma.user.findUnique({
      where: { id: validatedData.data.approvedById },
      select: { firstName: true, lastName: true }
    })

    if (!approver) {
      return { error: "Approver not found" }
    }

    const approverName = `${approver.firstName} ${approver.lastName}`.trim()
    const newCustody = validatedData.data.receivedByName

    // Use transaction to create title movement, update property, and create change history
    const result = await prisma.$transaction(async (tx) => {
      // Create the title movement directly as approved
      const titleMovement = await tx.titleMovement.create({
        data: {
          propertyId: validatedData.data.propertyId,
          purposeOfRelease: validatedData.data.purposeOfRelease,
          releasedBy: validatedData.data.releasedBy,
          approvedBy: approverName,
          receivedByTransmittal: validatedData.data.receivedByTransmittal,
          receivedByName: validatedData.data.receivedByName,
          dateReleased: new Date(),
          movementStatus: MovementStatus.RELEASED,
          movedById: session.user.id,
        },
      })

      // Update property custody
      await tx.property.update({
        where: { id: validatedData.data.propertyId },
        data: {
          custodyOfTitle: newCustody,
          updatedAt: new Date(),
          updatedById: session.user.id,
        },
      })

      // Create change history for title movement
      await tx.changeHistory.create({
        data: {
          propertyId: validatedData.data.propertyId,
          fieldName: "titleMovement",
          oldValue: null,
          newValue: JSON.stringify(titleMovement),
          changeType: "CREATE",
          changedById: session.user.id,
          reason: "Title movement created and auto-approved",
        },
      })

      // Create change history for custody update
      await tx.changeHistory.create({
        data: {
          propertyId: validatedData.data.propertyId,
          fieldName: "custodyOfTitle",
          oldValue: property.custodyOfTitle,
          newValue: newCustody,
          changeType: "UPDATE",
          changedById: session.user.id,
          reason: `Custody updated due to approved title movement to ${newCustody}`,
        },
      })

      // Create title movement documents if files were uploaded
      if (uploadedFiles && uploadedFiles.length > 0) {
        const getDocumentType = (fileName: string): DocumentType => {
          const extension = fileName.split('.').pop()?.toLowerCase()
          const name = fileName.toLowerCase()
          
          // Try to detect document type based on filename and extension
          if (name.includes('title') || name.includes('deed')) return DocumentType.TITLE_DEED
          if (name.includes('tax') && (name.includes('declaration') || name.includes('decl'))) return DocumentType.TAX_DECLARATION
          if (name.includes('tax') && (name.includes('receipt') || name.includes('payment'))) return DocumentType.TAX_RECEIPT
          if (name.includes('survey') || name.includes('plan')) return DocumentType.SURVEY_PLAN
          if (name.includes('mortgage') || name.includes('loan')) return DocumentType.MORTGAGE_CONTRACT
          if (name.includes('sale') || name.includes('deed of sale')) return DocumentType.SALE_AGREEMENT
          if (name.includes('lease') || name.includes('rent')) return DocumentType.LEASE_AGREEMENT
          if (name.includes('appraisal') || name.includes('valuation')) return DocumentType.APPRAISAL_REPORT
          if (extension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return DocumentType.PHOTO
          
          return DocumentType.OTHER
        }

        const documentPromises = uploadedFiles.map(file => 
          tx.propertyDocument.create({
            data: {
              propertyId: validatedData.data.propertyId,
              documentType: getDocumentType(file.name),
              fileName: file.name,
              fileUrl: file.fileUrl,
              fileSize: null, // File size not available from upload result
              mimeType: null, // MIME type not available from upload result
              description: `Document uploaded for title movement ${titleMovement.receivedByTransmittal || titleMovement.id}: ${file.name}`,
              uploadedAt: new Date(),
              isActive: true,
            },
          })
        )
        
        await Promise.all(documentPromises)
      }

      return titleMovement
    })

    // Fetch the complete movement data with property information for the transmittal
    const completeMovement = await prisma.titleMovement.findUnique({
      where: { id: result.id },
      include: {
        property: {
          select: {
            titleNumber: true,
            lotNumber: true,
            lotArea: true,
            location: true,
            barangay: true,
            city: true,
            province: true,
            registeredOwner: true,
            classification: true,
          }
        }
      }
    })

    revalidatePath("/title-movements")
    revalidatePath(`/properties/${validatedData.data.propertyId}`)
    
    if (!completeMovement) {
      return { error: "Failed to retrieve created movement data" }
    }

    return { 
      success: true, 
      data: {
        ...completeMovement,
        property: {
          ...completeMovement.property,
          lotArea: completeMovement.property.lotArea.toString()
        }
      }
    }
  } catch (error) {
    console.error("Error creating and approving title movement:", error)
    return { error: "Failed to create title movement" }
  }
}

export async function createTitleMovement(data: TitleMovementFormData): Promise<ActionResult<TitleMovement>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = TitleMovementSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
        details: validatedData.error.flatten().fieldErrors,
      }
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: validatedData.data.propertyId },
    })

    if (!property) {
      return { error: "Property not found" }
    }

    // Check for existing pending title movement workflows for this property
    const existingPendingWorkflow = await prisma.approvalWorkflow.findFirst({
      where: {
        propertyId: validatedData.data.propertyId,
        workflowType: WorkflowType.TITLE_TRANSFER,
        status: ApprovalStatus.PENDING,
      },
      include: {
        initiatedBy: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    if (existingPendingWorkflow) {
      const initiatorName = `${existingPendingWorkflow.initiatedBy.firstName} ${existingPendingWorkflow.initiatedBy.lastName}`.trim()
      return { 
        error: `A title movement request is already pending approval for this property. Please wait for the current request (initiated by ${initiatorName}) to be processed before creating a new one.` 
      }
    }

    // Check for active title movements that are not yet returned
    const activeTitleMovement = await prisma.titleMovement.findFirst({
      where: {
        propertyId: validatedData.data.propertyId,
        movementStatus: {
          in: [MovementStatus.RELEASED, MovementStatus.IN_TRANSIT, MovementStatus.RECEIVED, MovementStatus.PENDING_RETURN]
        }
      }
    })

    if (activeTitleMovement) {
      const statusDisplay = activeTitleMovement.movementStatus.replace('_', ' ').toLowerCase()
      return { 
        error: `Cannot create new title movement. The property title is currently ${statusDisplay}. Please wait for the title to be returned before creating a new movement request.` 
      }
    }

    // Verify the approver exists and has proper permissions
    const approver = await prisma.user.findUnique({
      where: { 
        id: validatedData.data.approvedById,
        isActive: true 
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    if (!approver) {
      return { error: "Selected approver not found or inactive" }
    }

    // Check if transmittal number is unique
    const existingTransmittal = await prisma.titleMovement.findFirst({
      where: { receivedByTransmittal: validatedData.data.receivedByTransmittal }
    })

    if (existingTransmittal) {
      return { error: "Transmittal number already exists. Please generate a new one." }
    }

    // Create approval workflow first
    const approvalWorkflow = await prisma.approvalWorkflow.create({
      data: {
        propertyId: validatedData.data.propertyId,
        workflowType: WorkflowType.TITLE_TRANSFER,
        description: `Title movement request: ${validatedData.data.purposeOfRelease}`,
        proposedChanges: {
          titleMovement: validatedData.data,
          action: "CREATE_MOVEMENT"
        },
        initiatedById: session.user.id,
      },
    })

    revalidatePath("/title-movements")
    revalidatePath("/approvals")
    revalidatePath(`/properties/${validatedData.data.propertyId}`)
    
    return { 
      success: true, 
      data: { id: approvalWorkflow.id } as TitleMovement
    }
  } catch (error) {
    console.error("Error creating title movement:", error)
    return { error: "Failed to create title movement request" }
  }
}

export async function updateTitleMovement(data: TitleMovementUpdateData): Promise<ActionResult<TitleMovement>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = TitleMovementUpdateSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
        details: validatedData.error.format(),
      }
    }

    const { id, movementStatus, ...updateData } = validatedData.data

    // Check if movement exists
    const existingMovement = await prisma.titleMovement.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            custodyOfTitle: true,
          }
        }
      }
    })

    if (!existingMovement) {
      return { error: "Title movement not found" }
    }

    // Prepare update data based on status
    const updateFields: Prisma.TitleMovementUpdateInput = {
      movementStatus,
      updatedAt: new Date(),
    }

    // Determine new custody based on status and add status-specific fields
    let newCustody: string | null = null
    
    switch (movementStatus) {
      case MovementStatus.IN_TRANSIT:
        if (updateData.receivedByTransmittal) {
          updateFields.receivedByTransmittal = updateData.receivedByTransmittal
        }
        newCustody = "In Transit"
        break
      case MovementStatus.RECEIVED:
        if (updateData.turnedOverBy) updateFields.turnedOverBy = updateData.turnedOverBy
        if (updateData.receivedByPerson) {
          updateFields.receivedByPerson = updateData.receivedByPerson
          newCustody = updateData.receivedByPerson
        } else if (existingMovement.receivedByName) {
          newCustody = existingMovement.receivedByName
        }
        updateFields.turnedOverDate = new Date()
        break
      case MovementStatus.RETURNED:
        if (updateData.returnedBy) updateFields.returnedBy = updateData.returnedBy
        if (updateData.receivedByOnReturn) {
          updateFields.receivedByOnReturn = updateData.receivedByOnReturn
          newCustody = updateData.receivedByOnReturn
        }
        updateFields.dateReturned = new Date()
        break
    }

    const titleMovement = await prisma.titleMovement.update({
      where: { id },
      data: updateFields,
    })

    // Update property custody if it changed
    if (newCustody && newCustody !== existingMovement.property.custodyOfTitle) {
      await prisma.property.update({
        where: { id: existingMovement.propertyId },
        data: {
          custodyOfTitle: newCustody,
          updatedAt: new Date(),
          updatedById: session.user.id,
        },
      })

      // Create change history for custody update
      await prisma.changeHistory.create({
        data: {
          propertyId: existingMovement.propertyId,
          fieldName: "custodyOfTitle",
          oldValue: existingMovement.property.custodyOfTitle,
          newValue: newCustody,
          changeType: "UPDATE",
          changedById: session.user.id,
          reason: `Custody updated due to title movement status change to ${movementStatus}`,
        },
      })
    }

    // Create change history for movement status
    await prisma.changeHistory.create({
      data: {
        propertyId: existingMovement.propertyId,
        fieldName: "movementStatus",
        oldValue: existingMovement.movementStatus,
        newValue: movementStatus,
        changeType: "STATUS_CHANGE",
        changedById: session.user.id,
        reason: `Title movement status updated to ${movementStatus}`,
      },
    })

    revalidatePath("/title-movements")
    revalidatePath(`/title-movements/${id}`)
    return { success: true, data: titleMovement }
  } catch (error) {
    console.error("Error updating title movement:", error)
    return { error: "Failed to update title movement" }
  }
}

export async function approveWorkflow(data: ApprovalDecisionData): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = ApprovalDecisionSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
        details: validatedData.error.format(),
      }
    }

    const { id, decision, rejectedReason } = validatedData.data

    // Get the workflow
    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id },
    })

    if (!workflow) {
      return { error: "Approval workflow not found" }
    }

    if (workflow.status !== ApprovalStatus.PENDING) {
      return { error: "Workflow has already been processed" }
    }

    if (decision === "APPROVED") {
      // Execute the title movement creation
      const proposedChanges = workflow.proposedChanges as { titleMovement: TitleMovementFormData }
      
      // Get the current property to track custody changes
      const currentProperty = await prisma.property.findUnique({
        where: { id: workflow.propertyId },
        select: { custodyOfTitle: true }
      })

      if (!currentProperty) {
        return { error: "Property not found" }
      }
      
      // Resolve the approver's name from user ID
      let approverName = ""
      if (proposedChanges.titleMovement.approvedById) {
        const approver = await prisma.user.findUnique({
          where: { id: proposedChanges.titleMovement.approvedById },
          select: { firstName: true, lastName: true }
        })
        if (approver) {
          approverName = `${approver.firstName} ${approver.lastName}`.trim()
        }
      }
      
      // Determine new custody based on receiving person/bank
      const newCustody = proposedChanges.titleMovement.receivedByName
      
      const titleMovement = await prisma.titleMovement.create({
        data: {
          propertyId: proposedChanges.titleMovement.propertyId,
          purposeOfRelease: proposedChanges.titleMovement.purposeOfRelease,
          releasedBy: proposedChanges.titleMovement.releasedBy,
          approvedBy: approverName,
          receivedByTransmittal: proposedChanges.titleMovement.receivedByTransmittal,
          receivedByName: proposedChanges.titleMovement.receivedByName,
          dateReleased: new Date(),
          movementStatus: MovementStatus.RELEASED,
          movedById: workflow.initiatedById,
        },
      })

      // Update property custody
      await prisma.property.update({
        where: { id: workflow.propertyId },
        data: {
          custodyOfTitle: newCustody,
          updatedAt: new Date(),
          updatedById: session.user.id,
        },
      })

      // Update workflow status
      await prisma.approvalWorkflow.update({
        where: { id },
        data: {
          status: ApprovalStatus.APPROVED,
          approvedById: session.user.id,
          approvedAt: new Date(),
        },
      })

      // Create change history for title movement
      await prisma.changeHistory.create({
        data: {
          propertyId: workflow.propertyId,
          fieldName: "titleMovement",
          oldValue: null,
          newValue: JSON.stringify(titleMovement),
          changeType: "CREATE",
          changedById: session.user.id,
          reason: "Title movement approved and created",
        },
      })

      // Create change history for custody update
      await prisma.changeHistory.create({
        data: {
          propertyId: workflow.propertyId,
          fieldName: "custodyOfTitle",
          oldValue: currentProperty.custodyOfTitle,
          newValue: newCustody,
          changeType: "UPDATE",
          changedById: session.user.id,
          reason: `Custody updated due to approved title movement to ${newCustody}`,
        },
      })

      revalidatePath("/title-movements")
      revalidatePath("/approvals")
      return { success: true }
    } else {
      // Reject the workflow
      await prisma.approvalWorkflow.update({
        where: { id },
        data: {
          status: ApprovalStatus.REJECTED,
          approvedById: session.user.id,
          approvedAt: new Date(),
          rejectedReason,
        },
      })

      revalidatePath("/approvals")
      return { success: true }
    }
  } catch (error) {
    console.error("Error processing approval:", error)
    return { error: "Failed to process approval" }
  }
}

export async function getTitleMovement(id: string): Promise<TitleMovementWithDetails | null> {
  try {
    const titleMovement = await prisma.titleMovement.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            titleNumber: true,
            lotNumber: true,
            lotArea: true,
            location: true,
            barangay: true,
            city: true,
            province: true,
            zipCode: true,
            description: true,
            classification: true,
            status: true,
            registeredOwner: true,
            bank: true,
            custodyOfTitle: true,
            encumbrance: true,
            mortgageDetails: true,
            borrowerMortgagor: true,
            taxDeclaration: true,
            remarks: true,
          },
        },
        movedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!titleMovement) {
      return null
    }

    // Convert Decimal to string for client component compatibility
    return {
      ...titleMovement,
      property: {
        ...titleMovement.property,
        lotArea: titleMovement.property.lotArea.toString(),
      },
    }
  } catch (error) {
    console.error("Error fetching title movement:", error)
    return null
  }
}

export async function getTitleMovements(params?: {
  propertyId?: string
  status?: MovementStatus
  page?: number
  limit?: number
}): Promise<{
  titleMovements: TitleMovementWithDetails[]
  totalCount: number
  totalPages: number
}> {
  try {
    const { propertyId, status, page = 1, limit = 10 } = params || {}
    const skip = (page - 1) * limit

    const where: Prisma.TitleMovementWhereInput = {
      ...(propertyId && { propertyId }),
      ...(status && { movementStatus: status }),
    }

    const [rawTitleMovements, totalCount] = await Promise.all([
      prisma.titleMovement.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              titleNumber: true,
              lotNumber: true,
              lotArea: true,
              location: true,
              barangay: true,
              city: true,
              province: true,
              zipCode: true,
              description: true,
              classification: true,
              status: true,
              registeredOwner: true,
              bank: true,
              custodyOfTitle: true,
              encumbrance: true,
              mortgageDetails: true,
              borrowerMortgagor: true,
              taxDeclaration: true,
              remarks: true,
            },
          },
          movedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.titleMovement.count({ where }),
    ])

    // Convert Decimal to string for client component compatibility
    const titleMovements = rawTitleMovements.map(movement => ({
      ...movement,
      property: {
        ...movement.property,
        lotArea: movement.property.lotArea.toString(),
      },
    }))

    const totalPages = Math.ceil(totalCount / limit)

    return {
      titleMovements,
      totalCount,
      totalPages,
    }
  } catch (error) {
    console.error("Error fetching title movements:", error)
    return {
      titleMovements: [],
      totalCount: 0,
      totalPages: 0,
    }
  }
}

export async function getPendingApprovals(): Promise<ApprovalWorkflowWithDetails[]> {
  try {
    const approvals = await prisma.approvalWorkflow.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        workflowType: WorkflowType.TITLE_TRANSFER,
      },
      include: {
        property: {
          select: {
            id: true,
            titleNumber: true,
            registeredOwner: true,
          },
        },
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
      orderBy: { createdAt: "desc" },
    })

    return approvals
  } catch (error) {
    console.error("Error fetching pending approvals:", error)
    return []
  }
}

export async function getMyApprovalRequests(): Promise<ApprovalWorkflowWithDetails[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const requests = await prisma.approvalWorkflow.findMany({
      where: {
        initiatedById: session.user.id,
        workflowType: WorkflowType.TITLE_TRANSFER,
      },
      include: {
        property: {
          select: {
            id: true,
            titleNumber: true,
            location: true,
            registeredOwner: true,
          },
        },
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return requests
  } catch (error) {
    console.error('Error fetching my approval requests:', error)
    throw new Error('Failed to fetch approval requests')
  }
}

export async function getApprovalsByStatus(status: ApprovalStatus): Promise<ApprovalWorkflowWithDetails[]> {
  try {
    const approvals = await prisma.approvalWorkflow.findMany({
      where: {
        status,
        workflowType: WorkflowType.TITLE_TRANSFER,
      },
      include: {
        property: {
          select: {
            id: true,
            titleNumber: true,
            location: true,
            registeredOwner: true,
          },
        },
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
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return approvals
  } catch (error) {
    console.error(`Error fetching ${status} approvals:`, error)
    throw new Error(`Failed to fetch ${status} approvals`)
  }
}

export async function checkTitleAvailability(propertyId: string): Promise<{
  isAvailable: boolean
  reason?: string
  details?: {
    hasPendingWorkflow: boolean
    hasActiveMovement: boolean
    pendingWorkflowInitiator?: string
    activeMovementStatus?: string
  }
}> {
  try {
    // Check for existing pending title movement workflows
    const existingPendingWorkflow = await prisma.approvalWorkflow.findFirst({
      where: {
        propertyId,
        workflowType: WorkflowType.TITLE_TRANSFER,
        status: ApprovalStatus.PENDING,
      },
      include: {
        initiatedBy: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    // Check for active title movements
    const activeTitleMovement = await prisma.titleMovement.findFirst({
      where: {
        propertyId,
        movementStatus: {
          in: [MovementStatus.RELEASED, MovementStatus.IN_TRANSIT, MovementStatus.RECEIVED, MovementStatus.PENDING_RETURN]
        }
      }
    })

    if (existingPendingWorkflow) {
      const initiatorName = `${existingPendingWorkflow.initiatedBy.firstName} ${existingPendingWorkflow.initiatedBy.lastName}`.trim()
      return {
        isAvailable: false,
        reason: `A title movement request is already pending approval (initiated by ${initiatorName})`,
        details: {
          hasPendingWorkflow: true,
          hasActiveMovement: false,
          pendingWorkflowInitiator: initiatorName,
        }
      }
    }

    if (activeTitleMovement) {
      const statusDisplay = activeTitleMovement.movementStatus.replace('_', ' ').toLowerCase()
      return {
        isAvailable: false,
        reason: `Title is currently ${statusDisplay}`,
        details: {
          hasPendingWorkflow: false,
          hasActiveMovement: true,
          activeMovementStatus: statusDisplay,
        }
      }
    }

    return {
      isAvailable: true,
      details: {
        hasPendingWorkflow: false,
        hasActiveMovement: false,
      }
    }
  } catch (error) {
    console.error("Error checking title availability:", error)
    return {
      isAvailable: false,
      reason: "Unable to check title status",
      details: {
        hasPendingWorkflow: false,
        hasActiveMovement: false,
      }
    }
  }
}

export async function returnTitleMovement(data: TitleReturnFormData): Promise<ActionResult<TitleMovement>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = TitleReturnSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
        details: validatedData.error.flatten().fieldErrors,
      }
    }

    // Check if movement exists and is returnable
    const existingMovement = await prisma.titleMovement.findUnique({
      where: { id: validatedData.data.movementId },
      include: {
        property: {
          select: {
            id: true,
            titleNumber: true,
            custodyOfTitle: true,
          }
        }
      }
    })

    if (!existingMovement) {
      return { error: "Title movement not found" }
    }

    // Check if movement is in a returnable state
    const returnableStatuses = ['RELEASED', 'IN_TRANSIT', 'RECEIVED', 'PENDING_RETURN']
    if (!returnableStatuses.includes(existingMovement.movementStatus)) {
      return { error: `Cannot return title with status: ${existingMovement.movementStatus}` }
    }

    // Update the movement with return information
    const updatedMovement = await prisma.titleMovement.update({
      where: { id: validatedData.data.movementId },
      data: {
        movementStatus: MovementStatus.RETURNED,
        returnedBy: validatedData.data.returnedBy,
        receivedByOnReturn: validatedData.data.receivedByOnReturn,
        dateReturned: validatedData.data.returnDate,
        updatedAt: new Date(),
      },
    })

    // Update property custody to the person who received it on return
    const newCustody = validatedData.data.receivedByOnReturn
    if (newCustody !== existingMovement.property.custodyOfTitle) {
      await prisma.property.update({
        where: { id: existingMovement.propertyId },
        data: {
          custodyOfTitle: newCustody,
          updatedAt: new Date(),
          updatedById: session.user.id,
        },
      })

      // Create change history for custody update
      await prisma.changeHistory.create({
        data: {
          propertyId: existingMovement.propertyId,
          fieldName: "custodyOfTitle",
          oldValue: existingMovement.property.custodyOfTitle,
          newValue: newCustody,
          changeType: "UPDATE",
          changedById: session.user.id,
          reason: `Custody updated due to title return - received by ${newCustody}`,
        },
      })
    }

    // Create change history for movement status
    await prisma.changeHistory.create({
      data: {
        propertyId: existingMovement.propertyId,
        fieldName: "movementStatus",
        oldValue: existingMovement.movementStatus,
        newValue: MovementStatus.RETURNED,
        changeType: "STATUS_CHANGE",
        changedById: session.user.id,
        reason: `Title returned by ${validatedData.data.returnedBy}`,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "TitleMovement",
        entityId: existingMovement.id,
        userId: session.user.id,
        changes: {
          action: "TITLE_RETURN",
          movementId: existingMovement.id,
          propertyTitle: existingMovement.property.titleNumber,
          returnedBy: validatedData.data.returnedBy,
          receivedByOnReturn: validatedData.data.receivedByOnReturn,
          returnCondition: validatedData.data.returnCondition,
          returnDate: validatedData.data.returnDate.toISOString(),
        },
        metadata: {
          documentsComplete: validatedData.data.documentsComplete,
          titleIntact: validatedData.data.titleIntact,
          returnNotes: validatedData.data.returnNotes,
        },
      },
    })

    revalidatePath("/title-movements")
    revalidatePath(`/properties/${existingMovement.propertyId}`)
    
    return { success: true, data: updatedMovement }
  } catch (error) {
    console.error("Error processing title return:", error)
    return { error: "Failed to process title return" }
  }
}

export async function exportTitleMovementsToCSV(): Promise<string> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Get all title movements with property and user details
    const titleMovements = await prisma.titleMovement.findMany({
      include: {
        property: {
          select: {
            titleNumber: true,
            lotNumber: true,
            lotArea: true,
            location: true,
            barangay: true,
            city: true,
            province: true,
            registeredOwner: true,
            classification: true,
            status: true,
          },
        },
        movedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Convert title movements to CSV format
    const csvHeaders = [
      'Property Title Number',
      'Property Lot Number',
      'Property Owner',
      'Property Location',
      'Property Classification',
      'Property Status',
      'Movement Status',
      'Date Released',
      'Released By',
      'Purpose of Release',
      'Approved By',
      'Received By (Transmittal)',
      'Received By Name',
      'Turned Over Date',
      'Turned Over By',
      'Received By Person',
      'Date Returned',
      'Returned By',
      'Received By On Return',
      'Moved By',
      'Moved By Email',
      'Created Date',
      'Updated Date'
    ]

    const csvRows = titleMovements.map(movement => [
      movement.property.titleNumber,
      movement.property.lotNumber,
      movement.property.registeredOwner,
      `${movement.property.barangay}, ${movement.property.city}, ${movement.property.province}`,
      movement.property.classification.replace('_', ' '),
      movement.property.status.replace('_', ' '),
      movement.movementStatus.replace('_', ' '),
      movement.dateReleased ? movement.dateReleased.toISOString().split('T')[0] : '',
      movement.releasedBy || '',
      movement.purposeOfRelease || '',
      movement.approvedBy || '',
      movement.receivedByTransmittal || '',
      movement.receivedByName || '',
      movement.turnedOverDate ? movement.turnedOverDate.toISOString().split('T')[0] : '',
      movement.turnedOverBy || '',
      movement.receivedByPerson || '',
      movement.dateReturned ? movement.dateReturned.toISOString().split('T')[0] : '',
      movement.returnedBy || '',
      movement.receivedByOnReturn || '',
      `${movement.movedBy.firstName} ${movement.movedBy.lastName}`,
      movement.movedBy.email,
      movement.createdAt.toISOString().split('T')[0],
      movement.updatedAt.toISOString().split('T')[0]
    ])

    // Escape CSV values that contain commas, quotes, or newlines
    const escapeCSVValue = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(escapeCSVValue).join(','))
    ].join('\n')

    return csvContent
  } catch (error) {
    console.error("Error exporting title movements to CSV:", error)
    throw new Error("Failed to export title movements to CSV")
  }
}

export async function getReturnableTitleMovements(): Promise<TitleMovementWithDetails[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const rawMovements = await prisma.titleMovement.findMany({
      where: {
        movementStatus: {
          in: [MovementStatus.RELEASED, MovementStatus.IN_TRANSIT, MovementStatus.RECEIVED, MovementStatus.PENDING_RETURN]
        }
      },
      include: {
        property: {
          select: {
            id: true,
            titleNumber: true,
            lotNumber: true,
            lotArea: true,
            location: true,
            barangay: true,
            city: true,
            province: true,
            zipCode: true,
            description: true,
            classification: true,
            status: true,
            registeredOwner: true,
            bank: true,
            custodyOfTitle: true,
            encumbrance: true,
            mortgageDetails: true,
            borrowerMortgagor: true,
            taxDeclaration: true,
            remarks: true,
          },
        },
        movedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { dateReleased: 'asc' }, // Oldest releases first
        { createdAt: 'asc' }
      ],
    })

    // Convert Decimal to string for client component compatibility
    const movements = rawMovements.map(movement => ({
      ...movement,
      property: {
        ...movement.property,
        lotArea: movement.property.lotArea.toString(),
      },
    }))

    return movements
  } catch (error) {
    console.error('Error fetching returnable title movements:', error)
    throw new Error('Failed to fetch returnable title movements')
  }
}

export async function generateNextTransmittalNumber(): Promise<string> {
  try {
    // Get the current year for the transmittal number format
    const currentYear = new Date().getFullYear()
    const yearSuffix = currentYear.toString().slice(-2) // Last 2 digits of year
    
    // Find the highest transmittal number for the current year
    // Check both existing movements and pending approval workflows
    const [movements, workflows] = await Promise.all([
      prisma.titleMovement.findMany({
        where: {
          receivedByTransmittal: {
            startsWith: `TM-${yearSuffix}-`
          }
        },
        select: {
          receivedByTransmittal: true
        }
      }),
      prisma.approvalWorkflow.findMany({
        where: {
          workflowType: WorkflowType.TITLE_TRANSFER,
          status: 'PENDING'
        },
        select: {
          proposedChanges: true
        }
      })
    ])

    let maxNumber = 0
    
    // Extract numbers from existing movements
    movements.forEach(movement => {
      if (movement.receivedByTransmittal) {
        const match = movement.receivedByTransmittal.match(/TM-\d{2}-(\d+)/)
        if (match) {
          const number = parseInt(match[1])
          if (number > maxNumber) {
            maxNumber = number
          }
        }
      }
    })

    // Extract numbers from pending workflows
    workflows.forEach(workflow => {
      const proposedChanges = workflow.proposedChanges as { titleMovement?: { receivedByTransmittal?: string } }
      const transmittal = proposedChanges?.titleMovement?.receivedByTransmittal
      if (transmittal) {
        const match = transmittal.match(/TM-\d{2}-(\d+)/)
        if (match) {
          const number = parseInt(match[1])
          if (number > maxNumber) {
            maxNumber = number
          }
        }
      }
    })

    const nextNumber = maxNumber + 1

    // Format: TM-YY-NNNN (e.g., TM-24-0001)
    const transmittalNumber = `TM-${yearSuffix}-${nextNumber.toString().padStart(4, '0')}`
    
    return transmittalNumber
  } catch (error) {
    console.error('Error generating transmittal number:', error)
    // Fallback to timestamp-based number if query fails
    const timestamp = Date.now().toString().slice(-6)
    return `TM-${new Date().getFullYear().toString().slice(-2)}-${timestamp}`
  }
}
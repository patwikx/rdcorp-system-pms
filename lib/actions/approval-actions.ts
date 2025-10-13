"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ApprovalStatus, WorkflowType, ChangeType } from "@prisma/client"

export interface ApprovalWorkflowWithDetails {
  id: string
  propertyId: string
  workflowType: string
  description: string
  status: string
  priority: string
  proposedChanges: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  approvedAt: Date | null
  rejectedReason: string | null
  property: {
    id: string
    titleNumber: string
    registeredOwner: string
    location?: string | null
    lotNumber?: string
    city?: string
    province?: string
    classification?: string
    status?: string
  }
  initiatedBy: {
    id: string
    firstName: string
    lastName: string
    email?: string
    department?: string | null
    position?: string | null
  }
  approvedBy: {
    id: string
    firstName: string
    lastName: string
    email?: string
    department?: string | null
    position?: string | null
  } | null
}

export interface ApprovalStats {
  pending: number
  approvedToday: number
  rejectedToday: number
}

export async function getAllApprovalWorkflows(): Promise<ApprovalWorkflowWithDetails[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const workflows = await prisma.approvalWorkflow.findMany({
      include: {
        property: {
          select: {
            id: true,
            titleNumber: true,
            registeredOwner: true,
            location: true,
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
      orderBy: [
        { priority: 'desc' }, // URGENT first, then HIGH, NORMAL, LOW
        { createdAt: 'desc' }
      ],
    })

    return workflows.map(workflow => ({
      ...workflow,
      workflowType: workflow.workflowType.toString(),
      status: workflow.status.toString(),
      priority: workflow.priority.toString(),
      proposedChanges: workflow.proposedChanges as Record<string, unknown>,
    }))
  } catch (error) {
    console.error('Error fetching approval workflows:', error)
    throw new Error('Failed to fetch approval workflows')
  }
}

export async function getApprovalStats(): Promise<ApprovalStats> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [pending, approvedToday, rejectedToday] = await Promise.all([
      prisma.approvalWorkflow.count({
        where: {
          status: ApprovalStatus.PENDING,
        },
      }),
      prisma.approvalWorkflow.count({
        where: {
          status: ApprovalStatus.APPROVED,
          approvedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.approvalWorkflow.count({
        where: {
          status: ApprovalStatus.REJECTED,
          approvedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    ])

    return {
      pending,
      approvedToday,
      rejectedToday,
    }
  } catch (error) {
    console.error('Error fetching approval stats:', error)
    throw new Error('Failed to fetch approval stats')
  }
}

export async function getPendingApprovalsByType(workflowType?: WorkflowType): Promise<ApprovalWorkflowWithDetails[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const workflows = await prisma.approvalWorkflow.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        ...(workflowType && { workflowType }),
      },
      include: {
        property: {
          select: {
            id: true,
            titleNumber: true,
            registeredOwner: true,
            location: true,
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
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' } // Oldest first for pending items
      ],
    })

    return workflows.map(workflow => ({
      ...workflow,
      workflowType: workflow.workflowType.toString(),
      status: workflow.status.toString(),
      priority: workflow.priority.toString(),
      proposedChanges: workflow.proposedChanges as Record<string, unknown>,
    }))
  } catch (error) {
    console.error('Error fetching pending approvals:', error)
    throw new Error('Failed to fetch pending approvals')
  }
}

export async function getMyApprovalRequests(): Promise<ApprovalWorkflowWithDetails[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const workflows = await prisma.approvalWorkflow.findMany({
      where: {
        initiatedById: session.user.id,
      },
      include: {
        property: {
          select: {
            id: true,
            titleNumber: true,
            registeredOwner: true,
            location: true,
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

    return workflows.map(workflow => ({
      ...workflow,
      workflowType: workflow.workflowType.toString(),
      status: workflow.status.toString(),
      priority: workflow.priority.toString(),
      proposedChanges: workflow.proposedChanges as Record<string, unknown>,
    }))
  } catch (error) {
    console.error('Error fetching my approval requests:', error)
    throw new Error('Failed to fetch my approval requests')
  }
}

export interface MyRequestStats {
  status: ApprovalStatus
  count: number
}

export interface MyRequestStatsResult {
  stats: MyRequestStats[]
  totalRequests: number
}

export async function getMyApprovalRequestStats(): Promise<MyRequestStatsResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Get count by status for current user's requests
    const statsRaw = await prisma.approvalWorkflow.groupBy({
      by: ['status'],
      where: {
        initiatedById: session.user.id,
      },
      _count: {
        id: true
      },
      orderBy: {
        status: 'asc'
      }
    })

    // Transform the data to match our interface
    const stats: MyRequestStats[] = statsRaw.map(stat => ({
      status: stat.status,
      count: stat._count.id
    }))

    // Calculate total requests
    const totalRequests = stats.reduce((sum, stat) => sum + stat.count, 0)

    return {
      stats,
      totalRequests
    }
  } catch (error) {
    console.error("Error fetching my approval request stats:", error)
    return {
      stats: [],
      totalRequests: 0
    }
  }
}

export async function getApprovalWorkflowById(id: string): Promise<ApprovalWorkflowWithDetails | null> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            titleNumber: true,
            registeredOwner: true,
            location: true,
            lotNumber: true,
            city: true,
            province: true,
            classification: true,
            status: true,
          },
        },
        initiatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            position: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            position: true,
          },
        },
      },
    })

    if (!workflow) {
      return null
    }

    return {
      ...workflow,
      workflowType: workflow.workflowType.toString(),
      status: workflow.status.toString(),
      priority: workflow.priority.toString(),
      proposedChanges: workflow.proposedChanges as Record<string, unknown>,
    }
  } catch (error) {
    console.error('Error fetching approval workflow:', error)
    return null
  }
}

export
 async function approveWorkflow(workflowId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Check if workflow exists and is pending
    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
    })

    if (!workflow) {
      return { error: 'Approval workflow not found' }
    }

    if (workflow.status !== ApprovalStatus.PENDING) {
      return { error: 'This request has already been processed' }
    }

    // Use transaction to update workflow and apply changes
    await prisma.$transaction(async (tx) => {
      // Update workflow status
      await tx.approvalWorkflow.update({
        where: { id: workflowId },
        data: {
          status: ApprovalStatus.APPROVED,
          approvedById: session.user.id,
          approvedAt: new Date(),
        },
      })

      // Apply changes based on workflow type
      if (workflow.workflowType === WorkflowType.PROPERTY_UPDATE) {
        await applyPropertyUpdate(tx, workflow, session.user.id)
      }
      // Add other workflow types here as needed
    })

    // Revalidate relevant paths
    revalidatePath('/approvals')
    revalidatePath(`/properties/${workflow.propertyId}`)
    revalidatePath('/properties')

    return { success: true }
  } catch (error) {
    console.error('Error approving workflow:', error)
    return { error: 'Failed to approve request' }
  }
}

export async function rejectWorkflow(workflowId: string, reason: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    if (!reason.trim()) {
      return { error: 'Rejection reason is required' }
    }

    // Check if workflow exists and is pending
    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
    })

    if (!workflow) {
      return { error: 'Approval workflow not found' }
    }

    if (workflow.status !== ApprovalStatus.PENDING) {
      return { error: 'This request has already been processed' }
    }

    // Update workflow status
    await prisma.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        status: ApprovalStatus.REJECTED,
        approvedById: session.user.id,
        approvedAt: new Date(),
        rejectedReason: reason,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error rejecting workflow:', error)
    return { error: 'Failed to reject request' }
  }
}

// Helper function to apply property updates when approved
async function applyPropertyUpdate(
  tx: any, // Prisma transaction client
  workflow: { id: string; propertyId: string; proposedChanges: any },
  approvedById: string
) {
  const proposedChanges = workflow.proposedChanges as Record<string, { oldValue: unknown; newValue: unknown; fieldName: string }>
  
  // Extract just the new values for the property update
  const updateData: Record<string, unknown> = {}
  const changeHistoryPromises = []
  
  for (const [fieldName, change] of Object.entries(proposedChanges)) {
    updateData[fieldName] = change.newValue
    
    // Create change history record
    changeHistoryPromises.push(
      tx.changeHistory.create({
        data: {
          propertyId: workflow.propertyId,
          fieldName,
          oldValue: change.oldValue ? String(change.oldValue) : null,
          newValue: change.newValue ? String(change.newValue) : null,
          changeType: ChangeType.UPDATE,
          changedById: approvedById,
          reason: `Property update approved via workflow ${workflow.id}`,
        },
      })
    )
  }

  // Apply the property updates
  await tx.property.update({
    where: { id: workflow.propertyId },
    data: {
      ...updateData,
      updatedById: approvedById,
    },
  })

  // Execute all change history creations
  if (changeHistoryPromises.length > 0) {
    await Promise.all(changeHistoryPromises)
  }
}
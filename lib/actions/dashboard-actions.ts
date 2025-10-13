"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PropertyClassification, PropertyStatus, TaxStatus, MovementStatus, ApprovalStatus } from "@prisma/client"

export interface DashboardStats {
  properties: {
    total: number
    active: number
    collateral: number
    byClassification: Array<{
      classification: PropertyClassification
      count: number
    }>
    recentlyAdded: Array<{
      id: string
      titleNumber: string
      registeredOwner: string
      classification: PropertyClassification
      createdAt: Date
    }>
  }
  taxes: {
    totalDue: number
    totalPaid: number
    overdue: number
    dueThisMonth: number
    collectionRate: number
    byStatus: Array<{
      status: TaxStatus
      count: number
      totalAmount: number
    }>
  }
  titleMovements: {
    totalReleased: number
    totalReturned: number
    currentlyOut: number
    overdue: number
    byStatus: Array<{
      status: MovementStatus
      count: number
    }>
  }
  approvals: {
    pending: number
    approved: number
    rejected: number
    myRequests: number
    byType: Array<{
      workflowType: string
      count: number
    }>
  }
  recentActivity: Array<{
    id: string
    action: string
    entityType: string
    entityId: string
    description: string
    user: {
      firstName: string
      lastName: string
    }
    createdAt: Date
  }>
}

export interface QuickAction {
  title: string
  description: string
  href: string
  icon: string
  permission?: {
    module: string
    action: string
  }
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return null
    }

    const user = session.user
    const permissions = user.role.permissions

    // Helper function to check permissions
    const hasPermission = (module: string, action: string): boolean => {
      return permissions.some(p => p.module === module && p.action === action)
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Properties Statistics
    const propertiesStats = hasPermission('property', 'read') ? await getPropertiesStats() : {
      total: 0,
      active: 0,
      collateral: 0,
      byClassification: [],
      recentlyAdded: []
    }

    // Tax Statistics
    const taxStats = hasPermission('tax', 'read') ? await getTaxStats(startOfMonth, endOfMonth) : {
      totalDue: 0,
      totalPaid: 0,
      overdue: 0,
      dueThisMonth: 0,
      collectionRate: 0,
      byStatus: []
    }

    // Title Movement Statistics
    const movementStats = hasPermission('title_movement', 'read') ? await getTitleMovementStats(thirtyDaysAgo) : {
      totalReleased: 0,
      totalReturned: 0,
      currentlyOut: 0,
      overdue: 0,
      byStatus: []
    }

    // Approval Statistics
    const approvalStats = hasPermission('approval', 'read') ? await getApprovalStats(user.id) : {
      pending: 0,
      approved: 0,
      rejected: 0,
      myRequests: 0,
      byType: []
    }

    // Recent Activity
    const recentActivity = await getRecentActivity()

    return {
      properties: propertiesStats,
      taxes: taxStats,
      titleMovements: movementStats,
      approvals: approvalStats,
      recentActivity
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return null
  }
}

async function getPropertiesStats() {
  const [
    totalProperties,
    activeProperties,
    collateralProperties,
    propertiesByClassification,
    recentProperties
  ] = await Promise.all([
    prisma.property.count({
      where: { isDeleted: false }
    }),
    prisma.property.count({
      where: { isDeleted: false, status: PropertyStatus.ACTIVE }
    }),
    prisma.property.count({
      where: { isDeleted: false, status: PropertyStatus.COLLATERAL }
    }),
    prisma.property.groupBy({
      by: ['classification'],
      where: { isDeleted: false },
      _count: { id: true }
    }),
    prisma.property.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        titleNumber: true,
        registeredOwner: true,
        classification: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ])

  return {
    total: totalProperties,
    active: activeProperties,
    collateral: collateralProperties,
    byClassification: propertiesByClassification.map(item => ({
      classification: item.classification,
      count: item._count.id
    })),
    recentlyAdded: recentProperties
  }
}

async function getTaxStats(startOfMonth: Date, endOfMonth: Date) {
  const [
    totalDueResult,
    totalPaidResult,
    overdueCount,
    dueThisMonthCount,
    taxesByStatus
  ] = await Promise.all([
    prisma.realPropertyTax.aggregate({
      _sum: { taxAmount: true },
      where: { status: { in: [TaxStatus.DUE, TaxStatus.OVERDUE, TaxStatus.PENDING] } }
    }),
    prisma.realPropertyTax.aggregate({
      _sum: { amountPaid: true },
      where: { status: TaxStatus.PAID }
    }),
    prisma.realPropertyTax.count({
      where: { status: TaxStatus.OVERDUE }
    }),
    prisma.realPropertyTax.count({
      where: {
        status: TaxStatus.DUE,
        dueDate: { gte: startOfMonth, lte: endOfMonth }
      }
    }),
    prisma.realPropertyTax.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { taxAmount: true }
    })
  ])

  const totalDue = Number(totalDueResult._sum.taxAmount || 0)
  const totalPaid = Number(totalPaidResult._sum.amountPaid || 0)
  const collectionRate = totalDue > 0 ? (totalPaid / (totalDue + totalPaid)) * 100 : 0

  return {
    totalDue,
    totalPaid,
    overdue: overdueCount,
    dueThisMonth: dueThisMonthCount,
    collectionRate: Math.round(collectionRate * 100) / 100,
    byStatus: taxesByStatus.map(item => ({
      status: item.status,
      count: item._count.id,
      totalAmount: Number(item._sum.taxAmount || 0)
    }))
  }
}

async function getTitleMovementStats(thirtyDaysAgo: Date) {
  const [
    totalReleased,
    totalReturned,
    currentlyOut,
    overdueMovements,
    movementsByStatus
  ] = await Promise.all([
    prisma.titleMovement.count({
      where: { movementStatus: MovementStatus.RELEASED }
    }),
    prisma.titleMovement.count({
      where: { movementStatus: MovementStatus.RETURNED }
    }),
    prisma.titleMovement.count({
      where: { 
        movementStatus: { in: [MovementStatus.RELEASED, MovementStatus.IN_TRANSIT, MovementStatus.RECEIVED] }
      }
    }),
    prisma.titleMovement.count({
      where: {
        movementStatus: { in: [MovementStatus.RELEASED, MovementStatus.IN_TRANSIT, MovementStatus.RECEIVED] },
        dateReleased: { lt: thirtyDaysAgo }
      }
    }),
    prisma.titleMovement.groupBy({
      by: ['movementStatus'],
      _count: { id: true }
    })
  ])

  return {
    totalReleased,
    totalReturned,
    currentlyOut,
    overdue: overdueMovements,
    byStatus: movementsByStatus.map(item => ({
      status: item.movementStatus,
      count: item._count.id
    }))
  }
}

async function getApprovalStats(userId: string) {
  const [
    pendingCount,
    approvedCount,
    rejectedCount,
    myRequestsCount,
    approvalsByType
  ] = await Promise.all([
    prisma.approvalWorkflow.count({
      where: { status: ApprovalStatus.PENDING }
    }),
    prisma.approvalWorkflow.count({
      where: { status: ApprovalStatus.APPROVED }
    }),
    prisma.approvalWorkflow.count({
      where: { status: ApprovalStatus.REJECTED }
    }),
    prisma.approvalWorkflow.count({
      where: { initiatedById: userId }
    }),
    prisma.approvalWorkflow.groupBy({
      by: ['workflowType'],
      _count: { id: true },
      where: { status: ApprovalStatus.PENDING }
    })
  ])

  return {
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
    myRequests: myRequestsCount,
    byType: approvalsByType.map(item => ({
      workflowType: item.workflowType,
      count: item._count.id
    }))
  }
}

async function getRecentActivity() {
  const recentAuditLogs = await prisma.auditLog.findMany({
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  return recentAuditLogs.map(log => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    description: getActivityDescription(log.action, log.entityType),
    user: log.user,
    createdAt: log.createdAt
  }))
}

function getActivityDescription(action: string, entityType: string): string {
  const actionMap: Record<string, string> = {
    CREATE: 'created',
    UPDATE: 'updated',
    DELETE: 'deleted',
    APPROVE: 'approved',
    REJECT: 'rejected',
    LOGIN: 'logged in',
    LOGOUT: 'logged out'
  }

  const entityMap: Record<string, string> = {
    Property: 'property',
    TitleMovement: 'title movement',
    RealPropertyTax: 'tax record',
    ApprovalWorkflow: 'approval request',
    User: 'user account'
  }

  const actionText = actionMap[action] || action.toLowerCase()
  const entityText = entityMap[entityType] || entityType.toLowerCase()

  return `${actionText} ${entityText}`
}

export async function getQuickActions(): Promise<QuickAction[]> {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  const permissions = session.user.role.permissions
  const hasPermission = (module: string, action: string): boolean => {
    return permissions.some(p => p.module === module && p.action === action)
  }

  const actions: QuickAction[] = []

  if (hasPermission('property', 'create')) {
    actions.push({
      title: 'Add Property',
      description: 'Register a new property in the system',
      href: '/properties/create',
      icon: 'Building2',
      permission: { module: 'property', action: 'create' }
    })
  }


  if (hasPermission('approval', 'read')) {
    actions.push({
      title: 'Review Approvals',
      description: 'Process pending approval requests',
      href: '/approvals',
      icon: 'CheckSquare',
      permission: { module: 'approval', action: 'read' }
    })
  }

  if (hasPermission('property', 'read')) {
    actions.push({
      title: 'Search Properties',
      description: 'Find and manage properties',
      href: '/properties',
      icon: 'Search',
      permission: { module: 'property', action: 'read' }
    })
  }

  if (hasPermission('document', 'read')) {
    actions.push({
      title: 'Manage Documents',
      description: 'Upload and organize documents',
      href: '/documents',
      icon: 'FolderOpen',
      permission: { module: 'document', action: 'read' }
    })
  }

  return actions
}
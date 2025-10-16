// lib/actions/notification-actions.ts
"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { addDays } from "date-fns"
import { NotificationType, NotificationPriority } from "@prisma/client"

export interface NotificationData {
  id: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  isRead: boolean
  readAt: Date | null
  actionUrl: string | null
  entityType: string | null
  entityId: string | null
  createdAt: Date
}

export async function getAllNotifications(): Promise<NotificationData[]> {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  try {
    // First, check and create system notifications if needed
    await checkAndCreateSystemNotifications(session.user.id)

    // Then fetch all notifications from database
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ isRead: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: 20,
    })

    return notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      isRead: notification.isRead,
      readAt: notification.readAt,
      actionUrl: notification.actionUrl,
      entityType: notification.entityType,
      entityId: notification.entityId,
      createdAt: notification.createdAt,
    }))
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}



async function checkAndCreateSystemNotifications(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) return

    // Check for overdue taxes
    await checkOverdueTaxNotifications(userId, user)

    // Check for pending approvals (for users with approval permissions)
    await checkPendingApprovalNotifications(userId, user)

    // Check for unreturned title movements
    await checkUnreturnedTitleNotifications(userId, user)

    // Check for system maintenance notifications (for admins)
    await checkSystemMaintenanceNotifications(userId, user)

  } catch (error) {
    console.error("Error checking system notifications:", error)
  }
}

async function checkOverdueTaxNotifications(userId: string, user: { role: { permissions: Array<{ permission: { module: string, action: string } }> } }): Promise<void> {
  const hasPermission = user.role.permissions.some(p => 
    p.permission.module === 'tax' && p.permission.action === 'read'
  )
  
  if (!hasPermission) return

  const today = new Date()
  const overdueTaxes = await prisma.realPropertyTax.findMany({
    where: {
      status: 'OVERDUE',
      dueDate: { lt: today }
    },
    include: {
      property: true
    },
    take: 10
  })

  for (const tax of overdueTaxes) {
    const daysOverdue = Math.ceil((today.getTime() - tax.dueDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Check if notification already exists
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId,
        entityId: tax.id,
        entityType: "RealPropertyTax",
        type: NotificationType.TAX,
        createdAt: { gte: addDays(today, -7) }
      }
    })

    if (existingNotification) continue

    const priority = daysOverdue > 90 ? NotificationPriority.URGENT : 
                    daysOverdue > 30 ? NotificationPriority.HIGH : NotificationPriority.NORMAL

    await prisma.notification.create({
      data: {
        userId,
        title: `Overdue Tax Payment - ${tax.property.titleNumber}`,
        message: `Property tax for ${tax.property.titleNumber} (${tax.property.registeredOwner}) is ${daysOverdue} days overdue. Amount due: ₱${tax.taxAmount.toNumber().toLocaleString()}`,
        type: NotificationType.TAX,
        priority,
        actionUrl: `/properties/${tax.property.id}?tab=taxes`,
        entityType: "RealPropertyTax",
        entityId: tax.id,
        expiresAt: addDays(today, 30)
      }
    })
  }
}

async function checkPendingApprovalNotifications(userId: string, user: { role: { permissions: Array<{ permission: { module: string, action: string } }> } }): Promise<void> {
  const hasPermission = user.role.permissions.some(p => 
    p.permission.module === 'approval' && p.permission.action === 'approve'
  )
  
  if (!hasPermission) return

  const pendingApprovals = await prisma.approvalWorkflow.findMany({
    where: {
      status: 'PENDING'
    },
    include: {
      property: true,
      initiatedBy: true
    },
    take: 10
  })

  for (const approval of pendingApprovals) {
    // Check if notification already exists
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId,
        entityId: approval.id,
        entityType: "ApprovalWorkflow",
        type: NotificationType.APPROVAL,
        createdAt: { gte: addDays(new Date(), -1) }
      }
    })

    if (existingNotification) continue

    const daysWaiting = Math.ceil((new Date().getTime() - approval.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const priority = daysWaiting > 7 ? NotificationPriority.HIGH : 
                    approval.priority === 'URGENT' ? NotificationPriority.URGENT : NotificationPriority.NORMAL

    await prisma.notification.create({
      data: {
        userId,
        title: `Pending Approval - ${approval.workflowType.replace('_', ' ')}`,
        message: `${approval.workflowType.replace('_', ' ')} for property ${approval.property.titleNumber} requires your approval. Initiated by ${approval.initiatedBy.firstName} ${approval.initiatedBy.lastName}.`,
        type: NotificationType.APPROVAL,
        priority,
        actionUrl: `/approvals/${approval.id}`,
        entityType: "ApprovalWorkflow",
        entityId: approval.id,
        expiresAt: addDays(new Date(), 30)
      }
    })
  }
}

async function checkUnreturnedTitleNotifications(userId: string, user: { role: { permissions: Array<{ permission: { module: string, action: string } }> } }): Promise<void> {
  const hasPermission = user.role.permissions.some(p => 
    p.permission.module === 'title_movement' && p.permission.action === 'read'
  )
  
  if (!hasPermission) return

  const today = new Date()
  const sevenDaysAgo = addDays(today, -7)
  
  const unreturnedTitles = await prisma.titleMovement.findMany({
    where: {
      movementStatus: { in: ['RELEASED', 'IN_TRANSIT', 'RECEIVED'] },
      dateReleased: { lt: sevenDaysAgo }
    },
    include: {
      property: true
    },
    take: 10
  })

  for (const movement of unreturnedTitles) {
    if (!movement.dateReleased) continue
    
    const daysOut = Math.ceil((today.getTime() - movement.dateReleased.getTime()) / (1000 * 60 * 60 * 24))
    
    // Check if notification already exists
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId,
        entityId: movement.id,
        entityType: "TitleMovement",
        type: NotificationType.TITLE_MOVEMENT,
        createdAt: { gte: addDays(today, -7) }
      }
    })

    if (existingNotification) continue

    const priority = daysOut > 30 ? NotificationPriority.URGENT : 
                    daysOut > 14 ? NotificationPriority.HIGH : NotificationPriority.NORMAL

    await prisma.notification.create({
      data: {
        userId,
        title: `Unreturned Title - ${movement.property.titleNumber}`,
        message: `Title for property ${movement.property.titleNumber} has been out for ${daysOut} days. Status: ${movement.movementStatus.replace('_', ' ')}. Please follow up on return.`,
        type: NotificationType.TITLE_MOVEMENT,
        priority,
        actionUrl: `/title-movements/${movement.id}`,
        entityType: "TitleMovement",
        entityId: movement.id,
        expiresAt: addDays(today, 30)
      }
    })
  }
}

async function checkSystemMaintenanceNotifications(userId: string, user: { role: { permissions: Array<{ permission: { module: string, action: string } }> } }): Promise<void> {
  const isAdmin = user.role.permissions.some(p => 
    p.permission.module === 'user' && p.permission.action === 'manage_roles'
  )
  
  if (!isAdmin) return

  // This would typically check system configurations or scheduled maintenance
  // For now, we'll create a sample maintenance notification
  const today = new Date()
  
  // Check if maintenance notification already exists
  const existingNotification = await prisma.notification.findFirst({
    where: {
      userId,
      type: NotificationType.MAINTENANCE,
      createdAt: { gte: addDays(today, -30) }
    }
  })

  if (existingNotification) return

  // Example: Create a maintenance reminder (this would be based on actual system data)
  await prisma.notification.create({
    data: {
      userId,
      title: "System Maintenance Reminder",
      message: "Regular system maintenance is recommended. Please review system logs and perform necessary updates.",
      type: NotificationType.MAINTENANCE,
      priority: NotificationPriority.LOW,
      actionUrl: "/admin/settings",
      expiresAt: addDays(today, 30)
    }
  })
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) {
    return false
  }

  try {
    await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
    
    return true
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return false
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) {
    return false
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
    
    return true
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return false
  }
}

// Helper functions to create notifications for specific events
export async function createPropertyNotification(
  userId: string,
  propertyId: string,
  title: string,
  message: string,
  priority: NotificationPriority = NotificationPriority.NORMAL
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: NotificationType.PROPERTY,
        priority,
        actionUrl: `/properties/${propertyId}`,
        entityType: "Property",
        entityId: propertyId,
        expiresAt: addDays(new Date(), 30)
      }
    })
  } catch (error) {
    console.error("Error creating property notification:", error)
  }
}

export async function createTaxNotification(
  userId: string,
  taxId: string,
  propertyId: string,
  title: string,
  message: string,
  priority: NotificationPriority = NotificationPriority.NORMAL
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: NotificationType.TAX,
        priority,
        actionUrl: `/properties/${propertyId}?tab=taxes`,
        entityType: "RealPropertyTax",
        entityId: taxId,
        expiresAt: addDays(new Date(), 30)
      }
    })
  } catch (error) {
    console.error("Error creating tax notification:", error)
  }
}

export async function createApprovalNotification(
  userId: string,
  approvalId: string,
  title: string,
  message: string,
  priority: NotificationPriority = NotificationPriority.NORMAL
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: NotificationType.APPROVAL,
        priority,
        actionUrl: `/approvals/${approvalId}`,
        entityType: "ApprovalWorkflow",
        entityId: approvalId,
        expiresAt: addDays(new Date(), 30)
      }
    })
  } catch (error) {
    console.error("Error creating approval notification:", error)
  }
}

export async function createTitleMovementNotification(
  userId: string,
  movementId: string,
  title: string,
  message: string,
  priority: NotificationPriority = NotificationPriority.NORMAL
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: NotificationType.TITLE_MOVEMENT,
        priority,
        actionUrl: `/title-movements/${movementId}`,
        entityType: "TitleMovement",
        entityId: movementId,
        expiresAt: addDays(new Date(), 30)
      }
    })
  } catch (error) {
    console.error("Error creating title movement notification:", error)
  }
}

export async function createDocumentNotification(
  userId: string,
  documentId: string,
  propertyId: string,
  title: string,
  message: string,
  priority: NotificationPriority = NotificationPriority.NORMAL
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: NotificationType.DOCUMENT,
        priority,
        actionUrl: `/properties/${propertyId}?tab=documents`,
        entityType: "PropertyDocument",
        entityId: documentId,
        expiresAt: addDays(new Date(), 30)
      }
    })
  } catch (error) {
    console.error("Error creating document notification:", error)
  }
}

// Test function to create a sample notification
export async function createTestNotification(userId: string): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title: "Welcome to the Notification System!",
        message: "This is a test notification to verify the system is working correctly. You can now receive real-time updates about important system events.",
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.NORMAL,
        actionUrl: "/dashboard",
        expiresAt: addDays(new Date(), 7)
      }
    })
  } catch (error) {
    console.error("Error creating test notification:", error)
  }
}
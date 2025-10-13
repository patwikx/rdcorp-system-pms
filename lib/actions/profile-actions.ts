import { prisma } from "@/lib/prisma"
import { AuditAction } from "@prisma/client"

export async function getProfileStats(userId: string) {
  try {
    const [
      propertiesCreated,
      titleMovements,
      approvalsMade,
      auditLogs,
      user
    ] = await Promise.all([
      prisma.property.count({
        where: { createdById: userId }
      }),
      prisma.titleMovement.count({
        where: { movedById: userId }
      }),
      prisma.approvalWorkflow.count({
        where: { approvedById: userId }
      }),
      prisma.auditLog.count({
        where: { userId }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true }
      })
    ])

    return {
      propertiesCreated,
      titleMovements,
      approvalsMade,
      auditLogs,
      memberSince: user?.createdAt || new Date()
    }
  } catch (error) {
    console.error("Error fetching profile stats:", error)
    return {
      propertiesCreated: 0,
      titleMovements: 0,
      approvalsMade: 0,
      auditLogs: 0,
      memberSince: new Date()
    }
  }
}

export async function getRecentActivity(userId: string, limit: number = 10) {
  try {
    const activities = await prisma.auditLog.findMany({
      where: { userId },
      select: {
        id: true,
        action: true,
        entityType: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return activities
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return []
  }
}

export async function updateProfile(userId: string, data: {
  firstName: string
  lastName: string
  email: string
  department?: string
  position?: string
}) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        department: data.department || null,
        position: data.position || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        position: true,
      }
    })

    // Create audit log for profile update
    await prisma.auditLog.create({
      data: {
        action: AuditAction.UPDATE,
        entityType: 'User',
        entityId: userId,
        userId,
        changes: {
          updated: data
        }
      }
    })

    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: "Failed to update profile" }
  }
}
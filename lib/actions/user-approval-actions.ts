"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export type ApproverUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  department: string | null
  position: string | null
}

export async function getCurrentUser(): Promise<{
  id: string
  firstName: string
  lastName: string
  email: string
} | null> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    })

    return user
  } catch (error) {
    console.error("Error fetching current user:", error)
    return null
  }
}

export async function getApprovalUsers(): Promise<ApproverUser[]> {
  try {
    // Get users who have approval permissions for title movements
    // This looks for users with roles that have "approval.approve" permission
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          permissions: {
            some: {
              permission: {
                name: "approval.approve"
              }
            }
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        position: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })

    return users
  } catch (error) {
    console.error("Error fetching approval users:", error)
    // Fallback: return all active users if permission-based query fails
    try {
      const fallbackUsers = await prisma.user.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          department: true,
          position: true,
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ]
      })
      return fallbackUsers
    } catch (fallbackError) {
      console.error("Error fetching fallback users:", fallbackError)
      return []
    }
  }
}
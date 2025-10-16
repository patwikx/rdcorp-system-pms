"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { CreateUserSchema, UpdateUserSchema, type CreateUserData, type UpdateUserData } from "@/lib/validations/user-schema"

export interface UserOption {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface UserWithRole {
  id: string
  firstName: string
  lastName: string
  email: string
  department: string | null
  position: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  role: {
    id: string
    name: string
    description: string | null
  }
}

interface ActionResult<T = unknown> {
  success?: boolean
  error?: string
  data?: T
}

export async function getUsersWithApprovalPermission(): Promise<UserOption[]> {
  try {
    // Get users who have approval permissions for title movements
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          permissions: {
            some: {
              permission: {
                module: 'title_movement',
                action: 'approve'
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
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })

    return users
  } catch (error) {
    console.error('Error fetching users with approval permission:', error)
    // Fallback to all active users if permission query fails
    return getAllActiveUsers()
  }
}

export async function getAllActiveUsers(): Promise<UserOption[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })

    return users
  } catch (error) {
    console.error('Error fetching active users:', error)
    throw new Error('Failed to fetch users')
  }
}

export async function getUsers(): Promise<UserWithRole[]> {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })

    return users
  } catch (error) {
    console.error('Error fetching users:', error)
    throw new Error('Failed to fetch users')
  }
}

export async function getUser(id: string): Promise<UserWithRole | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    })

    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    throw new Error('Failed to fetch user')
  }
}

export async function createUser(data: CreateUserData): Promise<ActionResult<UserWithRole>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = CreateUserSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.data.email }
    })

    if (existingUser) {
      return { error: "Email already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.data.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: validatedData.data.firstName,
        lastName: validatedData.data.lastName,
        email: validatedData.data.email,
        password: hashedPassword,
        roleId: validatedData.data.roleId,
        department: validatedData.data.department,
        position: validatedData.data.position,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    })

    revalidatePath('/users')
    return { success: true, data: user }
  } catch (error) {
    console.error('Error creating user:', error)
    return { error: "Failed to create user" }
  }
}

export async function updateUser(data: UpdateUserData): Promise<ActionResult<UserWithRole>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = UpdateUserSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
      }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: validatedData.data.id }
    })

    if (!existingUser) {
      return { error: "User not found" }
    }

    // Check if new email conflicts with existing user
    if (validatedData.data.email !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: validatedData.data.email }
      })

      if (emailConflict) {
        return { error: "Email already exists" }
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: validatedData.data.id },
      data: {
        firstName: validatedData.data.firstName,
        lastName: validatedData.data.lastName,
        email: validatedData.data.email,
        roleId: validatedData.data.roleId,
        department: validatedData.data.department,
        position: validatedData.data.position,
        isActive: validatedData.data.isActive,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    })

    revalidatePath('/users')
    return { success: true, data: user }
  } catch (error) {
    console.error('Error updating user:', error)
    return { error: "Failed to update user" }
  }
}

export async function deleteUser(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return { error: "User not found" }
    }

    // Cannot delete self
    if (user.id === session.user.id) {
      return { error: "Cannot delete your own account" }
    }

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })

    revalidatePath('/users')
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { error: "Failed to delete user" }
  }
}

export async function resetUserPassword(id: string, newPassword: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return { error: "User not found" }
    }

    // Validate password length
    if (newPassword.length < 6) {
      return { error: "Password must be at least 6 characters long" }
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    })

    revalidatePath('/users')
    return { success: true }
  } catch (error) {
    console.error('Error resetting user password:', error)
    return { error: "Failed to reset password" }
  }
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  roleStats: Array<{
    roleName: string
    count: number
  }>
  recentUsers: number
}

export async function getUserStats(): Promise<UserStats> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Get basic counts
    const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } })
    ])

    // Get role statistics
    const roleStatsRaw = await prisma.user.groupBy({
      by: ['roleId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get role names for the stats
    const roleIds = roleStatsRaw.map(stat => stat.roleId)
    const roles = await prisma.role.findMany({
      where: {
        id: {
          in: roleIds
        }
      },
      select: {
        id: true,
        name: true
      }
    })

    const roleMap = new Map(roles.map(role => [role.id, role.name]))
    const roleStats = roleStatsRaw.map(stat => ({
      roleName: roleMap.get(stat.roleId) || 'Unknown Role',
      count: stat._count.id
    }))

    // Get users created in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleStats,
      recentUsers
    }
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      roleStats: [],
      recentUsers: 0
    }
  }
}
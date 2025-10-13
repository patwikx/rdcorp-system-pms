"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { CreateRoleSchema, UpdateRoleSchema, type CreateRoleData, type UpdateRoleData } from "@/lib/validations/role-schema"
import type { RoleWithPermissions, PermissionOption, ActionResult } from "@/lib/types/role-types"

// Server actions
export async function getRoles(): Promise<RoleWithPermissions[]> {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' }
      ]
    })

    return roles
  } catch (error) {
    console.error('Error fetching roles:', error)
    throw new Error('Failed to fetch roles')
  }
}

export async function getRole(id: string): Promise<RoleWithPermissions | null> {
  try {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    return role
  } catch (error) {
    console.error('Error fetching role:', error)
    throw new Error('Failed to fetch role')
  }
}

export async function getAllPermissions(): Promise<PermissionOption[]> {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { action: 'asc' }
      ]
    })

    return permissions
  } catch (error) {
    console.error('Error fetching permissions:', error)
    throw new Error('Failed to fetch permissions')
  }
}

export async function createRole(data: CreateRoleData): Promise<ActionResult<RoleWithPermissions>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = CreateRoleSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
      }
    }

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: validatedData.data.name }
    })

    if (existingRole) {
      return { error: "Role name already exists" }
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name: validatedData.data.name,
        description: validatedData.data.description,
        permissions: validatedData.data.permissionIds.length > 0 ? {
          create: validatedData.data.permissionIds.map(permissionId => ({
            permissionId
          }))
        } : undefined
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    revalidatePath('/users/roles')
    return { success: true, data: role }
  } catch (error) {
    console.error('Error creating role:', error)
    return { error: "Failed to create role" }
  }
}

export async function updateRole(data: UpdateRoleData): Promise<ActionResult<RoleWithPermissions>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = UpdateRoleSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
      }
    }

    // Check if role exists and is not system role for certain operations
    const existingRole = await prisma.role.findUnique({
      where: { id: validatedData.data.id }
    })

    if (!existingRole) {
      return { error: "Role not found" }
    }

    if (existingRole.isSystem && (validatedData.data.name !== existingRole.name)) {
      return { error: "Cannot modify system role name" }
    }

    // Check if new name conflicts with existing role
    if (validatedData.data.name !== existingRole.name) {
      const nameConflict = await prisma.role.findUnique({
        where: { name: validatedData.data.name }
      })

      if (nameConflict) {
        return { error: "Role name already exists" }
      }
    }

    // Update role and permissions
    const role = await prisma.$transaction(async (tx) => {
      // Delete existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: validatedData.data.id }
      })

      // Update role and create new permissions
      return await tx.role.update({
        where: { id: validatedData.data.id },
        data: {
          name: validatedData.data.name,
          description: validatedData.data.description,
          isActive: validatedData.data.isActive,
          permissions: validatedData.data.permissionIds.length > 0 ? {
            create: validatedData.data.permissionIds.map(permissionId => ({
              permissionId
            }))
          } : undefined
        },
        include: {
          permissions: {
            include: {
              permission: true
            }
          },
          _count: {
            select: {
              users: true
            }
          }
        }
      })
    })

    revalidatePath('/users/roles')
    return { success: true, data: role }
  } catch (error) {
    console.error('Error updating role:', error)
    return { error: "Failed to update role" }
  }
}

export async function deleteRole(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    // Check if role exists and can be deleted
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    if (!role) {
      return { error: "Role not found" }
    }

    if (role.isSystem) {
      return { error: "Cannot delete system role" }
    }

    if (role._count.users > 0) {
      return { error: "Cannot delete role with assigned users" }
    }

    await prisma.role.delete({
      where: { id }
    })

    revalidatePath('/users/roles')
    return { success: true }
  } catch (error) {
    console.error('Error deleting role:', error)
    return { error: "Failed to delete role" }
  }
}

export interface RoleStats {
  totalRoles: number
  activeRoles: number
  inactiveRoles: number
  systemRoles: number
  totalUsers: number
  totalPermissions: number
}

export async function getRoleStats(): Promise<RoleStats> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Get basic role counts
    const [totalRoles, activeRoles, inactiveRoles, systemRoles] = await Promise.all([
      prisma.role.count(),
      prisma.role.count({ where: { isActive: true } }),
      prisma.role.count({ where: { isActive: false } }),
      prisma.role.count({ where: { isSystem: true } })
    ])

    // Get total users and permissions
    const [totalUsers, totalPermissions] = await Promise.all([
      prisma.user.count(),
      prisma.permission.count()
    ])

    return {
      totalRoles,
      activeRoles,
      inactiveRoles,
      systemRoles,
      totalUsers,
      totalPermissions
    }
  } catch (error) {
    console.error("Error fetching role stats:", error)
    return {
      totalRoles: 0,
      activeRoles: 0,
      inactiveRoles: 0,
      systemRoles: 0,
      totalUsers: 0,
      totalPermissions: 0
    }
  }
}
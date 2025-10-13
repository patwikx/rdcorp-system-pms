"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ChangeType } from "@prisma/client"

export interface ChangeHistoryWithDetails {
  id: string
  propertyId: string
  fieldName: string
  oldValue: string | null
  newValue: string | null
  changeType: string
  changedAt: Date
  reason: string | null
  changedBy: {
    id: string
    firstName: string
    lastName: string
  }
}

export async function getPropertyChangeHistory(propertyId: string): Promise<ChangeHistoryWithDetails[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const changeHistory = await prisma.changeHistory.findMany({
      where: {
        propertyId,
      },
      include: {
        changedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        changedAt: 'desc',
      },
    })

    return changeHistory.map(change => ({
      ...change,
      changeType: change.changeType.toString(),
    }))
  } catch (error) {
    console.error('Error fetching change history:', error)
    throw new Error('Failed to fetch change history')
  }
}

export async function getAllChangeHistory(params?: {
  search?: string
  changeType?: ChangeType
  fieldName?: string
  userId?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}): Promise<{
  changes: ChangeHistoryWithDetails[]
  totalCount: number
  totalPages: number
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const { 
      search, 
      changeType, 
      fieldName, 
      userId, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = params || {}
    
    const skip = (page - 1) * limit

    const where = {
      ...(search && {
        OR: [
          { fieldName: { contains: search, mode: "insensitive" as const } },
          { oldValue: { contains: search, mode: "insensitive" as const } },
          { newValue: { contains: search, mode: "insensitive" as const } },
          { reason: { contains: search, mode: "insensitive" as const } },
          {
            changedBy: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
              ],
            },
          },
          {
            property: {
              OR: [
                { titleNumber: { contains: search, mode: "insensitive" as const } },
                { registeredOwner: { contains: search, mode: "insensitive" as const } },
              ],
            },
          },
        ],
      }),
      ...(changeType && { changeType }),
      ...(fieldName && { fieldName }),
      ...(userId && { changedById: userId }),
      ...(startDate && endDate && {
        changedAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    }

    const [changes, totalCount] = await Promise.all([
      prisma.changeHistory.findMany({
        where,
        include: {
          changedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          property: {
            select: {
              id: true,
              titleNumber: true,
              registeredOwner: true,
            },
          },
        },
        orderBy: {
          changedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.changeHistory.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      changes: changes.map(change => ({
        id: change.id,
        propertyId: change.propertyId,
        fieldName: change.fieldName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        changeType: change.changeType.toString(),
        changedAt: change.changedAt,
        reason: change.reason,
        changedBy: change.changedBy,
      })),
      totalCount,
      totalPages,
    }
  } catch (error) {
    console.error('Error fetching all change history:', error)
    throw new Error('Failed to fetch change history')
  }
}

export async function getChangeHistoryStats(): Promise<{
  totalChanges: number
  changesThisMonth: number
  changesThisWeek: number
  mostActiveUsers: Array<{
    userId: string
    userName: string
    changeCount: number
  }>
  mostChangedFields: Array<{
    fieldName: string
    changeCount: number
  }>
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const [
      totalChanges,
      changesThisMonth,
      changesThisWeek,
      mostActiveUsersRaw,
      mostChangedFieldsRaw,
    ] = await Promise.all([
      prisma.changeHistory.count(),
      prisma.changeHistory.count({
        where: {
          changedAt: {
            gte: startOfMonth,
          },
        },
      }),
      prisma.changeHistory.count({
        where: {
          changedAt: {
            gte: startOfWeek,
          },
        },
      }),
      prisma.changeHistory.groupBy({
        by: ['changedById'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      }),
      prisma.changeHistory.groupBy({
        by: ['fieldName'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      }),
    ])

    // Get user details for most active users
    const userIds = mostActiveUsersRaw.map(item => item.changedById)
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    })

    const mostActiveUsers = mostActiveUsersRaw.map(item => {
      const user = users.find(u => u.id === item.changedById)
      return {
        userId: item.changedById,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        changeCount: item._count.id,
      }
    })

    const mostChangedFields = mostChangedFieldsRaw.map(item => ({
      fieldName: item.fieldName,
      changeCount: item._count.id,
    }))

    return {
      totalChanges,
      changesThisMonth,
      changesThisWeek,
      mostActiveUsers,
      mostChangedFields,
    }
  } catch (error) {
    console.error('Error fetching change history stats:', error)
    throw new Error('Failed to fetch change history statistics')
  }
}
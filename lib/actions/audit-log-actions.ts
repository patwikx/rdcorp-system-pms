import { prisma } from "@/lib/prisma"
import { AuditAction } from "@prisma/client"

interface GetAuditLogsParams {
  search?: string
  action?: AuditAction
  entityType?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export async function getAuditLogs({
  search,
  action,
  entityType,
  userId,
  dateFrom,
  dateTo,
  page = 1,
  limit = 20,
}: GetAuditLogsParams) {
  try {
    const skip = (page - 1) * limit

    // Build where clause
    const where: {
      OR?: Array<Record<string, unknown>>
      action?: AuditAction
      entityType?: string
      userId?: string
      createdAt?: {
        gte?: Date
        lte?: Date
      }
    } = {}

    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { user: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ]
    }

    if (action) {
      where.action = action
    }

    if (entityType) {
      where.entityType = entityType
    }

    if (userId) {
      where.userId = userId
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(`${dateTo}T23:59:59.999Z`)
      }
    }

    // Get audit logs with user information
    const [auditLogs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      auditLogs,
      totalCount,
      totalPages,
      currentPage: page,
    }
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    throw new Error("Failed to fetch audit logs")
  }
}
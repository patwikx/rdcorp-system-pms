"use server"

import { prisma } from "@/lib/prisma"
import { MovementStatus } from "@prisma/client"

interface MovementStats {
  status: MovementStatus
  count: number
}

interface TitleMovementStatsResult {
  stats: MovementStats[]
  totalMovements: number
}

export async function getTitleMovementStats(): Promise<TitleMovementStatsResult> {
  try {
    // Get count by status
    const statsRaw = await prisma.titleMovement.groupBy({
      by: ['movementStatus'],
      _count: {
        id: true
      },
      orderBy: {
        movementStatus: 'asc'
      }
    })

    // Transform the data to match our interface
    const stats: MovementStats[] = statsRaw.map(stat => ({
      status: stat.movementStatus,
      count: stat._count.id
    }))

    // Calculate total movements
    const totalMovements = stats.reduce((sum, stat) => sum + stat.count, 0)

    return {
      stats,
      totalMovements
    }
  } catch (error) {
    console.error("Error fetching title movement stats:", error)
    return {
      stats: [],
      totalMovements: 0
    }
  }
}
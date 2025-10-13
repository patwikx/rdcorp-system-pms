"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { DocumentType } from "@prisma/client"

export interface PropertyDocumentWithDetails {
  id: string
  propertyId: string
  documentType: DocumentType
  fileName: string
  fileUrl: string
  fileSize: number | null
  mimeType: string | null
  description: string | null
  uploadedAt: Date
  isActive: boolean
  property: {
    id: string
    titleNumber: string
    registeredOwner: string
    location: string | null
    city: string
    province: string
  }
}

export interface DocumentStats {
  documentType: DocumentType
  count: number
}

export interface DocumentStatsResult {
  stats: DocumentStats[]
  totalDocuments: number
  activeDocuments: number
}

export async function getAllDocuments(): Promise<PropertyDocumentWithDetails[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const documents = await prisma.propertyDocument.findMany({
      where: {
        isActive: true
      },
      include: {
        property: {
          select: {
            id: true,
            titleNumber: true,
            registeredOwner: true,
            location: true,
            city: true,
            province: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    return documents
  } catch (error) {
    console.error('Error fetching documents:', error)
    throw new Error('Failed to fetch documents')
  }
}

export async function getDocumentStats(): Promise<DocumentStatsResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Get count by document type for active documents
    const statsRaw = await prisma.propertyDocument.groupBy({
      by: ['documentType'],
      where: {
        isActive: true
      },
      _count: {
        id: true
      },
      orderBy: {
        documentType: 'asc'
      }
    })

    // Get total counts
    const [totalDocuments, activeDocuments] = await Promise.all([
      prisma.propertyDocument.count(),
      prisma.propertyDocument.count({
        where: {
          isActive: true
        }
      })
    ])

    // Transform the data to match our interface
    const stats: DocumentStats[] = statsRaw.map(stat => ({
      documentType: stat.documentType,
      count: stat._count.id
    }))

    return {
      stats,
      totalDocuments,
      activeDocuments
    }
  } catch (error) {
    console.error("Error fetching document stats:", error)
    return {
      stats: [],
      totalDocuments: 0,
      activeDocuments: 0
    }
  }
}
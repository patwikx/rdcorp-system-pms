"use server"

import { prisma } from "@/lib/prisma"

// Types for search results
export interface BaseSearchResult {
  id: string
  title: string
  subtitle?: string
  type: SearchResultType
  url: string
}

export interface PropertySearchResult extends BaseSearchResult {
  type: 'property'
  titleNumber: string
  registeredOwner: string
  location: string
  classification: string
  status: string
}

export interface UserSearchResult extends BaseSearchResult {
  type: 'user'
  email: string
  department: string | null
  position: string | null
  role: string
}

export interface TaxSearchResult extends BaseSearchResult {
  type: 'tax'
  propertyTitle: string
  taxYear: number
  status: string
  taxAmount: string
  propertyId: string
}

export interface ApprovalSearchResult extends BaseSearchResult {
  type: 'approval'
  workflowType: string
  status: string
  propertyTitle: string
  propertyId: string
  priority: string
}

export interface TitleMovementSearchResult extends BaseSearchResult {
  type: 'title-movement'
  propertyTitle: string
  movementStatus: string
  propertyId: string
  dateReleased: Date | null
}

export interface DocumentSearchResult extends BaseSearchResult {
  type: 'document'
  documentType: string
  fileName: string
  propertyTitle: string
  propertyId: string
}

export type SearchResult = 
  | PropertySearchResult 
  | UserSearchResult 
  | TaxSearchResult 
  | ApprovalSearchResult 
  | TitleMovementSearchResult 
  | DocumentSearchResult

export type SearchResultType = 'property' | 'user' | 'tax' | 'approval' | 'title-movement' | 'document'

export async function searchAllRecords(query: string): Promise<SearchResult[]> {
  if (!query.trim() || query.length < 2) {
    return []
  }

  const searchTerm = query.toLowerCase()
  const results: SearchResult[] = []

  try {
    // Search Properties
    const properties = await prisma.property.findMany({
      where: {
        isDeleted: false,
        OR: [
          { titleNumber: { contains: searchTerm, mode: 'insensitive' } },
          { lotNumber: { contains: searchTerm, mode: 'insensitive' } },
          { registeredOwner: { contains: searchTerm, mode: 'insensitive' } },
          { location: { contains: searchTerm, mode: 'insensitive' } },
          { barangay: { contains: searchTerm, mode: 'insensitive' } },
          { city: { contains: searchTerm, mode: 'insensitive' } },
          { province: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { bank: { contains: searchTerm, mode: 'insensitive' } },
          { custodyOfTitle: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 10,
      select: {
        id: true,
        titleNumber: true,
        lotNumber: true,
        registeredOwner: true,
        location: true,
        barangay: true,
        city: true,
        province: true,
        classification: true,
        status: true,
        description: true
      }
    })

    properties.forEach(property => {
      const locationStr = [property.barangay, property.city, property.province].filter(Boolean).join(', ')
      results.push({
        id: property.id,
        type: 'property',
        title: property.titleNumber,
        subtitle: `${property.registeredOwner} - ${locationStr}`,
        url: `/properties/${property.id}`,
        titleNumber: property.titleNumber,
        registeredOwner: property.registeredOwner,
        location: locationStr,
        classification: property.classification,
        status: property.status
      })
    })

    // Search Users
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { department: { contains: searchTerm, mode: 'insensitive' } },
          { position: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 10,
      include: {
        role: {
          select: {
            name: true
          }
        }
      }
    })

    users.forEach(user => {
      const name = `${user.firstName} ${user.lastName}`
      const subtitle = [user.position, user.department].filter(Boolean).join(' - ')
      
      results.push({
        id: user.id,
        type: 'user',
        title: name,
        subtitle: subtitle || user.role.name,
        url: `/users/${user.id}`,
        email: user.email,
        department: user.department,
        position: user.position,
        role: user.role.name
      })
    })

    // Search Real Property Taxes
    const taxes = await prisma.realPropertyTax.findMany({
      where: {
        OR: [
          { property: { titleNumber: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { registeredOwner: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { barangay: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { city: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { province: { contains: searchTerm, mode: 'insensitive' } } },
          { officialReceiptNumber: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 10,
      include: {
        property: {
          select: {
            id: true,
            titleNumber: true,
            registeredOwner: true,
            barangay: true,
            city: true,
            province: true
          }
        }
      }
    })

    taxes.forEach(tax => {
      const locationStr = [tax.property.barangay, tax.property.city, tax.property.province].filter(Boolean).join(', ')
      results.push({
        id: tax.id,
        type: 'tax',
        title: `${tax.property.titleNumber} - ${tax.taxYear}`,
        subtitle: `${tax.property.registeredOwner} - ${locationStr}`,
        url: `/property-tax/${tax.id}`,
        propertyTitle: tax.property.titleNumber,
        taxYear: tax.taxYear,
        status: tax.status,
        taxAmount: `₱${tax.taxAmount.toNumber().toLocaleString()}`,
        propertyId: tax.property.id
      })
    })

    // Search Approval Workflows
    const approvals = await prisma.approvalWorkflow.findMany({
      where: {
        OR: [
          { property: { titleNumber: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { registeredOwner: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { barangay: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { city: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { province: { contains: searchTerm, mode: 'insensitive' } } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 10,
      include: {
        property: {
          select: {
            id: true,
            titleNumber: true,
            registeredOwner: true,
            barangay: true,
            city: true,
            province: true
          }
        }
      }
    })

    approvals.forEach(approval => {
      const locationStr = [approval.property.barangay, approval.property.city, approval.property.province].filter(Boolean).join(', ')
      results.push({
        id: approval.id,
        type: 'approval',
        title: `${approval.workflowType.replace('_', ' ')} - ${approval.property.titleNumber}`,
        subtitle: `${approval.property.registeredOwner} - ${locationStr}`,
        url: `/approvals/${approval.id}`,
        workflowType: approval.workflowType,
        status: approval.status,
        propertyTitle: approval.property.titleNumber,
        propertyId: approval.property.id,
        priority: approval.priority
      })
    })

    // Search Title Movements
    const movements = await prisma.titleMovement.findMany({
      where: {
        OR: [
          { property: { titleNumber: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { registeredOwner: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { barangay: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { city: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { province: { contains: searchTerm, mode: 'insensitive' } } },
          { purposeOfRelease: { contains: searchTerm, mode: 'insensitive' } },
          { releasedBy: { contains: searchTerm, mode: 'insensitive' } },
          { receivedByName: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 10,
      include: {
        property: {
          select: {
            id: true,
            titleNumber: true,
            registeredOwner: true,
            barangay: true,
            city: true,
            province: true
          }
        }
      }
    })

    movements.forEach(movement => {
      const locationStr = [movement.property.barangay, movement.property.city, movement.property.province].filter(Boolean).join(', ')
      results.push({
        id: movement.id,
        type: 'title-movement',
        title: `${movement.property.titleNumber} Movement`,
        subtitle: `${movement.property.registeredOwner} - ${locationStr}`,
        url: `/title-movements/${movement.id}`,
        propertyTitle: movement.property.titleNumber,
        movementStatus: movement.movementStatus,
        propertyId: movement.property.id,
        dateReleased: movement.dateReleased
      })
    })

    // Search Property Documents
    const documents = await prisma.propertyDocument.findMany({
      where: {
        isActive: true,
        OR: [
          { fileName: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { property: { titleNumber: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { registeredOwner: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { barangay: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { city: { contains: searchTerm, mode: 'insensitive' } } },
          { property: { province: { contains: searchTerm, mode: 'insensitive' } } }
        ]
      },
      take: 10,
      include: {
        property: {
          select: {
            id: true,
            titleNumber: true,
            registeredOwner: true,
            barangay: true,
            city: true,
            province: true
          }
        }
      }
    })

    documents.forEach(document => {
      const locationStr = [document.property.barangay, document.property.city, document.property.province].filter(Boolean).join(', ')
      results.push({
        id: document.id,
        type: 'document',
        title: document.fileName,
        subtitle: `${document.property.titleNumber} - ${locationStr}`,
        url: `/documents/${document.id}`,
        documentType: document.documentType,
        fileName: document.fileName,
        propertyTitle: document.property.titleNumber,
        propertyId: document.property.id
      })
    })

    // Sort results by relevance (exact matches first, then partial matches)
    return results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(searchTerm)
      const bExact = b.title.toLowerCase().includes(searchTerm)
      
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      return a.title.localeCompare(b.title)
    })

  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

//Search specifically by location (barangay, city, province)
export async function searchByLocation(query: string): Promise<SearchResult[]> {
  if (!query.trim() || query.length < 2) {
    return []
  }

  const searchTerm = query.toLowerCase()
  const results: SearchResult[] = []

  try {
    // Search Properties by location
    const properties = await prisma.property.findMany({
      where: {
        isDeleted: false,
        OR: [
          { barangay: { contains: searchTerm, mode: 'insensitive' } },
          { city: { contains: searchTerm, mode: 'insensitive' } },
          { province: { contains: searchTerm, mode: 'insensitive' } },
          { location: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 20,
      select: {
        id: true,
        titleNumber: true,
        registeredOwner: true,
        location: true,
        barangay: true,
        city: true,
        province: true,
        classification: true,
        status: true
      }
    })

    properties.forEach(property => {
      const locationStr = [property.barangay, property.city, property.province].filter(Boolean).join(', ')
      results.push({
        id: property.id,
        type: 'property',
        title: property.titleNumber,
        subtitle: `${property.registeredOwner} - ${locationStr}`,
        url: `/properties/${property.id}`,
        titleNumber: property.titleNumber,
        registeredOwner: property.registeredOwner,
        location: locationStr,
        classification: property.classification,
        status: property.status
      })
    })

    return results.sort((a, b) => a.title.localeCompare(b.title))

  } catch (error) {
    console.error('Location search error:', error)
    return []
  }
}

// Get search suggestions based on existing data
export async function getSearchSuggestions(): Promise<{
  locations: string[]
  owners: string[]
  titleNumbers: string[]
}> {
  try {
    const [locations, owners, titleNumbers] = await Promise.all([
      // Get unique locations
      prisma.property.findMany({
        where: { isDeleted: false },
        select: { barangay: true, city: true, province: true },
        distinct: ['barangay', 'city', 'province'],
        take: 50
      }),
      // Get unique owners
      prisma.property.findMany({
        where: { isDeleted: false },
        select: { registeredOwner: true },
        distinct: ['registeredOwner'],
        take: 50
      }),
      // Get recent title numbers
      prisma.property.findMany({
        where: { isDeleted: false },
        select: { titleNumber: true },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ])

    const uniqueLocations = new Set<string>()
    locations.forEach(loc => {
      if (loc.barangay) uniqueLocations.add(loc.barangay)
      if (loc.city) uniqueLocations.add(loc.city)
      if (loc.province) uniqueLocations.add(loc.province)
    })

    return {
      locations: Array.from(uniqueLocations).sort(),
      owners: owners.map(o => o.registeredOwner).sort(),
      titleNumbers: titleNumbers.map(t => t.titleNumber).sort()
    }
  } catch (error) {
    console.error('Error getting search suggestions:', error)
    return { locations: [], owners: [], titleNumbers: [] }
  }
}
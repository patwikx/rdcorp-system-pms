"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { 
  RealPropertyTaxSchema, 
  RealPropertyTaxUpdateSchema,
  RealPropertyTaxPaymentSchema,
  type RealPropertyTaxFormData, 
  type RealPropertyTaxUpdateData,
  type RealPropertyTaxPaymentData
} from "@/lib/validations/real-property-tax-schema"
import { RealPropertyTax, TaxStatus } from "@prisma/client"

export type ActionResult<T = unknown> = {
  error?: string
  success?: boolean
  data?: T
  details?: Record<string, unknown>
}

export type SerializedRealPropertyTax = Omit<RealPropertyTax, 'taxAmount' | 'amountPaid' | 'discount' | 'penalty' | 'interest'> & {
  taxAmount: number
  amountPaid: number | null
  discount: number | null
  penalty: number | null
  interest: number | null
}

export async function createRealPropertyTax(data: RealPropertyTaxFormData): Promise<ActionResult<SerializedRealPropertyTax>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = RealPropertyTaxSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
        details: validatedData.error.format(),
      }
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: validatedData.data.propertyId },
    })

    if (!property) {
      return { error: "Property not found" }
    }

    // Check for duplicate tax record (same property, year, and quarter)
    const whereClause = {
      propertyId: validatedData.data.propertyId,
      taxYear: validatedData.data.taxYear,
      taxQuarter: validatedData.data.taxQuarter ?? null,
    }
    
    const existingTax = await prisma.realPropertyTax.findFirst({
      where: whereClause,
    })

    if (existingTax) {
      return { 
        error: `Tax record already exists for ${validatedData.data.taxYear}${validatedData.data.taxQuarter ? ` Q${validatedData.data.taxQuarter}` : ' (Annual)'}` 
      }
    }

    const tax = await prisma.realPropertyTax.create({
      data: {
        ...validatedData.data,
        recordedById: session.user.id,
      },
    })

    // Convert Decimal fields to numbers for client compatibility
    const serializedTax = {
      ...tax,
      taxAmount: Number(tax.taxAmount),
      amountPaid: tax.amountPaid ? Number(tax.amountPaid) : null,
      discount: tax.discount ? Number(tax.discount) : null,
      penalty: tax.penalty ? Number(tax.penalty) : null,
      interest: tax.interest ? Number(tax.interest) : null,
    }

    revalidatePath(`/properties/${validatedData.data.propertyId}`)
    return { success: true, data: serializedTax }
  } catch (error) {
    console.error("Error creating real property tax:", error)
    return { error: "Failed to create tax record" }
  }
}

export async function updateRealPropertyTax(data: RealPropertyTaxUpdateData): Promise<ActionResult<SerializedRealPropertyTax>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = RealPropertyTaxUpdateSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid form data",
        details: validatedData.error.format(),
      }
    }

    const { id, ...updateData } = validatedData.data

    // Check if tax record exists
    const existingTax = await prisma.realPropertyTax.findUnique({
      where: { id },
    })

    if (!existingTax) {
      return { error: "Tax record not found" }
    }

    const tax = await prisma.realPropertyTax.update({
      where: { id },
      data: updateData,
    })

    // Convert Decimal fields to numbers for client compatibility
    const serializedTax = {
      ...tax,
      taxAmount: Number(tax.taxAmount),
      amountPaid: tax.amountPaid ? Number(tax.amountPaid) : null,
      discount: tax.discount ? Number(tax.discount) : null,
      penalty: tax.penalty ? Number(tax.penalty) : null,
      interest: tax.interest ? Number(tax.interest) : null,
    }

    revalidatePath(`/properties/${existingTax.propertyId}`)
    return { success: true, data: serializedTax }
  } catch (error) {
    console.error("Error updating real property tax:", error)
    return { error: "Failed to update tax record" }
  }
}

export async function markTaxAsPaid(data: RealPropertyTaxPaymentData): Promise<ActionResult<SerializedRealPropertyTax>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const validatedData = RealPropertyTaxPaymentSchema.safeParse(data)
    if (!validatedData.success) {
      return {
        error: "Invalid payment data",
        details: validatedData.error.format(),
      }
    }

    const { id, ...paymentData } = validatedData.data

    // Check if tax record exists
    const existingTax = await prisma.realPropertyTax.findUnique({
      where: { id },
    })

    if (!existingTax) {
      return { error: "Tax record not found" }
    }

    if (existingTax.isPaid) {
      return { error: "Tax record is already marked as paid" }
    }

    // Determine if fully paid or partially paid
    const totalDue = Number(existingTax.taxAmount)
    const amountPaid = paymentData.amountPaid
    const isPaid = amountPaid >= totalDue
    const status = isPaid ? TaxStatus.PAID : TaxStatus.PARTIALLY_PAID

    const tax = await prisma.realPropertyTax.update({
      where: { id },
      data: {
        ...paymentData,
        isPaid,
        status,
      },
    })

    // Convert Decimal fields to numbers for client compatibility
    const serializedTax = {
      ...tax,
      taxAmount: Number(tax.taxAmount),
      amountPaid: tax.amountPaid ? Number(tax.amountPaid) : null,
      discount: tax.discount ? Number(tax.discount) : null,
      penalty: tax.penalty ? Number(tax.penalty) : null,
      interest: tax.interest ? Number(tax.interest) : null,
    }

    revalidatePath(`/properties/${existingTax.propertyId}`)
    return { success: true, data: serializedTax }
  } catch (error) {
    console.error("Error marking tax as paid:", error)
    return { error: "Failed to process payment" }
  }
}

export async function deleteRealPropertyTax(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    // Check if tax record exists
    const existingTax = await prisma.realPropertyTax.findUnique({
      where: { id },
    })

    if (!existingTax) {
      return { error: "Tax record not found" }
    }

    await prisma.realPropertyTax.delete({
      where: { id },
    })

    revalidatePath(`/properties/${existingTax.propertyId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting real property tax:", error)
    return { error: "Failed to delete tax record" }
  }
}

export type RealPropertyTaxWithDetails = Omit<RealPropertyTax, 'taxAmount' | 'amountPaid' | 'discount' | 'penalty' | 'interest'> & {
  taxAmount: string
  amountPaid: string | null
  discount: string | null
  penalty: string | null
  interest: string | null
  property: {
    id: string
    titleNumber: string
    registeredOwner: string
    lotNumber: string
    city: string
    province: string
  }
  recordedBy: {
    id: string
    firstName: string
    lastName: string
  }
}

export async function getAllRealPropertyTaxes(params?: {
  status?: TaxStatus
  year?: number
  propertyId?: string
  page?: number
  limit?: number
}): Promise<{
  taxes: RealPropertyTaxWithDetails[]
  totalCount: number
  totalPages: number
}> {
  try {
    const { status, year, propertyId, page = 1, limit = 20 } = params || {}
    const skip = (page - 1) * limit

    const where: {
      status?: TaxStatus
      taxYear?: number
      propertyId?: string
    } = {}

    if (status) where.status = status
    if (year) where.taxYear = year
    if (propertyId) where.propertyId = propertyId

    const [rawTaxes, totalCount] = await Promise.all([
      prisma.realPropertyTax.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              titleNumber: true,
              registeredOwner: true,
              lotNumber: true,
              city: true,
              province: true,
            },
          },
          recordedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { taxYear: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.realPropertyTax.count({ where }),
    ])

    // Convert Decimal fields to strings for client compatibility
    const taxes: RealPropertyTaxWithDetails[] = rawTaxes.map(tax => ({
      ...tax,
      taxAmount: tax.taxAmount.toString(),
      amountPaid: tax.amountPaid?.toString() || null,
      discount: tax.discount?.toString() || null,
      penalty: tax.penalty?.toString() || null,
      interest: tax.interest?.toString() || null,
    }))

    const totalPages = Math.ceil(totalCount / limit)

    return {
      taxes,
      totalCount,
      totalPages,
    }
  } catch (error) {
    console.error("Error fetching real property taxes:", error)
    return {
      taxes: [],
      totalCount: 0,
      totalPages: 0,
    }
  }
}

export async function getPaymentHistory(params?: {
  propertyId?: string
  year?: number
  page?: number
  limit?: number
}): Promise<{
  payments: RealPropertyTaxWithDetails[]
  totalCount: number
  totalPages: number
}> {
  try {
    const { propertyId, year, page = 1, limit = 20 } = params || {}
    const skip = (page - 1) * limit

    const where: {
      isPaid: boolean
      taxYear?: number
      propertyId?: string
    } = {
      isPaid: true,
    }

    if (year) where.taxYear = year
    if (propertyId) where.propertyId = propertyId

    const [rawPayments, totalCount] = await Promise.all([
      prisma.realPropertyTax.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              titleNumber: true,
              registeredOwner: true,
              lotNumber: true,
              city: true,
              province: true,
            },
          },
          recordedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { paymentDate: 'desc' },
          { taxYear: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.realPropertyTax.count({ where }),
    ])

    // Convert Decimal fields to strings for client compatibility
    const payments: RealPropertyTaxWithDetails[] = rawPayments.map(payment => ({
      ...payment,
      taxAmount: payment.taxAmount.toString(),
      amountPaid: payment.amountPaid?.toString() || null,
      discount: payment.discount?.toString() || null,
      penalty: payment.penalty?.toString() || null,
      interest: payment.interest?.toString() || null,
    }))

    const totalPages = Math.ceil(totalCount / limit)

    return {
      payments,
      totalCount,
      totalPages,
    }
  } catch (error) {
    console.error("Error fetching payment history:", error)
    return {
      payments: [],
      totalCount: 0,
      totalPages: 0,
    }
  }
}

export async function getTaxSummary(): Promise<{
  totalTaxes: number
  totalAmount: string
  paidTaxes: number
  paidAmount: string
  unpaidTaxes: number
  unpaidAmount: string
  overdueTaxes: number
}> {
  try {
    const [allTaxes, paidTaxes, unpaidTaxes] = await Promise.all([
      prisma.realPropertyTax.findMany({
        select: {
          taxAmount: true,
          isPaid: true,
          dueDate: true,
        },
      }),
      prisma.realPropertyTax.findMany({
        where: { isPaid: true },
        select: {
          taxAmount: true,
        },
      }),
      prisma.realPropertyTax.findMany({
        where: { isPaid: false },
        select: {
          taxAmount: true,
          dueDate: true,
        },
      }),
    ])

    const totalAmount = allTaxes.reduce((sum, tax) => sum + Number(tax.taxAmount), 0)
    const paidAmount = paidTaxes.reduce((sum, tax) => sum + Number(tax.taxAmount), 0)
    const unpaidAmount = unpaidTaxes.reduce((sum, tax) => sum + Number(tax.taxAmount), 0)
    const overdueTaxes = unpaidTaxes.filter(tax => new Date(tax.dueDate) < new Date()).length

    return {
      totalTaxes: allTaxes.length,
      totalAmount: totalAmount.toString(),
      paidTaxes: paidTaxes.length,
      paidAmount: paidAmount.toString(),
      unpaidTaxes: unpaidTaxes.length,
      unpaidAmount: unpaidAmount.toString(),
      overdueTaxes,
    }
  } catch (error) {
    console.error("Error fetching tax summary:", error)
    return {
      totalTaxes: 0,
      totalAmount: '0',
      paidTaxes: 0,
      paidAmount: '0',
      unpaidTaxes: 0,
      unpaidAmount: '0',
      overdueTaxes: 0,
    }
  }
}
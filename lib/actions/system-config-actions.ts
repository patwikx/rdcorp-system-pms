"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export interface SystemConfigItem {
  id: string
  key: string
  value: string
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SystemConfigStats {
  totalConfigs: number
  activeConfigs: number
  inactiveConfigs: number
  recentlyUpdated: number
}

export interface SystemConfigGroup {
  category: string
  configs: SystemConfigItem[]
}

interface ActionResult<T = unknown> {
  success?: boolean
  error?: string
  data?: T
}

export async function getSystemConfigs(): Promise<SystemConfigItem[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const configs = await prisma.systemConfig.findMany({
      orderBy: [
        { key: 'asc' }
      ]
    })

    return configs
  } catch (error) {
    console.error('Error fetching system configs:', error)
    throw new Error('Failed to fetch system configs')
  }
}

export async function getSystemConfigStats(): Promise<SystemConfigStats> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Get basic counts
    const [totalConfigs, activeConfigs, inactiveConfigs] = await Promise.all([
      prisma.systemConfig.count(),
      prisma.systemConfig.count({ where: { isActive: true } }),
      prisma.systemConfig.count({ where: { isActive: false } })
    ])

    // Get configs updated in the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentlyUpdated = await prisma.systemConfig.count({
      where: {
        updatedAt: {
          gte: sevenDaysAgo
        }
      }
    })

    return {
      totalConfigs,
      activeConfigs,
      inactiveConfigs,
      recentlyUpdated
    }
  } catch (error) {
    console.error("Error fetching system config stats:", error)
    return {
      totalConfigs: 0,
      activeConfigs: 0,
      inactiveConfigs: 0,
      recentlyUpdated: 0
    }
  }
}

export async function getSystemConfigsByCategory(): Promise<SystemConfigGroup[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const configs = await getSystemConfigs()
    
    // Group configs by category (extracted from key prefix)
    const groups = new Map<string, SystemConfigItem[]>()
    
    configs.forEach(config => {
      const category = config.key.split('.')[0] || 'General'
      if (!groups.has(category)) {
        groups.set(category, [])
      }
      groups.get(category)!.push(config)
    })

    // Convert to array and sort
    return Array.from(groups.entries())
      .map(([category, configs]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        configs: configs.sort((a, b) => a.key.localeCompare(b.key))
      }))
      .sort((a, b) => a.category.localeCompare(b.category))
  } catch (error) {
    console.error('Error fetching system configs by category:', error)
    return []
  }
}

export async function updateSystemConfig(
  id: string, 
  value: string, 
  description?: string
): Promise<ActionResult<SystemConfigItem>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    // Check if config exists
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { id }
    })

    if (!existingConfig) {
      return { error: "Configuration not found" }
    }

    // Update config
    const config = await prisma.systemConfig.update({
      where: { id },
      data: {
        value,
        description: description !== undefined ? description : existingConfig.description
      }
    })

    revalidatePath('/admin/settings')
    return { success: true, data: config }
  } catch (error) {
    console.error('Error updating system config:', error)
    return { error: "Failed to update configuration" }
  }
}

export async function createSystemConfig(
  key: string,
  value: string,
  description?: string
): Promise<ActionResult<SystemConfigItem>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    // Check if key already exists
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { key }
    })

    if (existingConfig) {
      return { error: "Configuration key already exists" }
    }

    // Create config
    const config = await prisma.systemConfig.create({
      data: {
        key,
        value,
        description
      }
    })

    revalidatePath('/admin/settings')
    return { success: true, data: config }
  } catch (error) {
    console.error('Error creating system config:', error)
    return { error: "Failed to create configuration" }
  }
}

export async function toggleSystemConfigStatus(id: string): Promise<ActionResult<SystemConfigItem>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    // Get current config
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { id }
    })

    if (!existingConfig) {
      return { error: "Configuration not found" }
    }

    // Toggle status
    const config = await prisma.systemConfig.update({
      where: { id },
      data: {
        isActive: !existingConfig.isActive
      }
    })

    revalidatePath('/admin/settings')
    return { success: true, data: config }
  } catch (error) {
    console.error('Error toggling system config status:', error)
    return { error: "Failed to update configuration status" }
  }
}
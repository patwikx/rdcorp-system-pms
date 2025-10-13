// Types for role management
export interface RoleWithPermissions {
  id: string
  name: string
  description: string | null
  isActive: boolean
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
  permissions: {
    id: string
    permission: {
      id: string
      name: string
      module: string
      action: string
      description: string | null
    }
  }[]
  _count: {
    users: number
  }
}

export interface PermissionOption {
  id: string
  name: string
  module: string
  action: string
  description: string | null
}

export interface ActionResult<T = unknown> {
  success?: boolean
  error?: string
  data?: T
}
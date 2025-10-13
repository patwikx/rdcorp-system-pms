"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRoles } from "@/lib/actions/role-actions"
import type { RoleWithPermissions } from "@/lib/types/role-types"
import { Shield, Edit, Users, Lock, Settings, Calendar } from "lucide-react"
import { toast } from "sonner"

interface RolesListProps {
  searchParams: Promise<{
    search?: string
    status?: string
    type?: string
    page?: string
  }>
}

function getRoleStatusColor(isActive: boolean) {
  return isActive 
    ? "bg-green-100 text-green-800 border-green-200" 
    : "bg-gray-100 text-gray-800 border-gray-200"
}

export function RolesList({ searchParams }: RolesListProps) {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<{
    search?: string
    status?: string
    type?: string
  }>({})

  useEffect(() => {
    const loadFilters = async () => {
      const params = await searchParams
      setFilters(params)
    }
    loadFilters()
  }, [searchParams])

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    setLoading(true)
    try {
      const result = await getRoles()
      setRoles(result)
    } catch (error) {
      console.error("Error loading roles:", error)
      toast.error("Failed to load roles")
    } finally {
      setLoading(false)
    }
  }

  // Filter roles based on search and filters
  const filteredRoles = roles.filter(role => {
    const matchesSearch = !filters.search || 
      role.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(filters.search.toLowerCase()))

    const matchesStatus = !filters.status || 
      filters.status === "all-status" || 
      (filters.status === "active" && role.isActive) ||
      (filters.status === "inactive" && !role.isActive)

    const matchesType = !filters.type || 
      filters.type === "all-types" || 
      (filters.type === "system" && role.isSystem) ||
      (filters.type === "custom" && !role.isSystem)

    return matchesSearch && matchesStatus && matchesType
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading roles...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (roles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No roles found</h3>
          <p className="text-muted-foreground text-center mb-4">
            Get started by creating your first role.
          </p>
          <Button asChild>
            <Link href="/users/roles/create">Create Role</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (filteredRoles.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No roles match your criteria</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter settings.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRoles.map((role) => (
          <Card key={role.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
                    {role.isSystem ? (
                      <Lock className="h-4 w-4 text-primary" />
                    ) : (
                      <Shield className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg font-semibold truncate flex items-center gap-2" title={role.name}>
                      <span>{role.name}</span>
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-xs">
                          System
                        </Badge>
                      )}
                    </CardTitle>
                    {role.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2" title={role.description}>
                        {role.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Badge className={`${getRoleStatusColor(role.isActive)} w-fit text-xs`}>
                {role.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">
                    {role._count.users} user{role._count.users !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <Settings className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">
                    {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {role.permissions.length > 0 && (
                <div className="pt-2 border-t space-y-2">
                  <div className="text-xs text-muted-foreground">Sample permissions:</div>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 2).map((rolePermission: { id: string; permission: { module: string; action: string } }) => (
                      <Badge key={rolePermission.id} variant="outline" className="text-xs">
                        {rolePermission.permission.module}.{rolePermission.permission.action}
                      </Badge>
                    ))}
                    {role.permissions.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Calendar className="h-3 w-3" />
                  <span>Created {new Date(role.createdAt).toLocaleDateString()}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs h-8" asChild>
                  <Link href={`/users/roles/${role.id}/edit`}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit Role
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredRoles.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredRoles.length} of {roles.length} roles
        </div>
      )}
    </div>
  )
}
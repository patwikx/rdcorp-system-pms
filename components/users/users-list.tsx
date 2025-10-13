"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUsers, type UserWithRole } from "@/lib/actions/user-actions"
import { User, Edit, Building, Briefcase, Shield, Eye, Calendar } from "lucide-react"
import { toast } from "sonner"

interface UsersListProps {
  searchParams: Promise<{
    search?: string
    status?: string
    role?: string
    department?: string
    page?: string
  }>
}

function getUserStatusColor(isActive: boolean) {
  return isActive 
    ? "bg-green-100 text-green-800 border-green-200" 
    : "bg-gray-100 text-gray-800 border-gray-200"
}

export function UsersList({ searchParams }: UsersListProps) {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<{
    search?: string
    status?: string
    role?: string
    department?: string
  }>({})

  useEffect(() => {
    const loadFilters = async () => {
      const params = await searchParams
      setFilters(params)
    }
    loadFilters()
  }, [searchParams])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const result = await getUsers()
      setUsers(result)
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !filters.search || 
      user.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(filters.search.toLowerCase())) ||
      (user.position && user.position.toLowerCase().includes(filters.search.toLowerCase()))

    const matchesStatus = !filters.status || 
      filters.status === "all-status" || 
      (filters.status === "active" && user.isActive) ||
      (filters.status === "inactive" && !user.isActive)

    const matchesRole = !filters.role || 
      filters.role === "all-roles" || 
      user.role.name === filters.role

    const matchesDepartment = !filters.department || 
      filters.department === "all-departments" || 
      user.department === filters.department

    return matchesSearch && matchesStatus && matchesRole && matchesDepartment
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground text-center mb-4">
            Get started by creating your first user.
          </p>
          <Button asChild>
            <Link href="/users/create">Create User</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (filteredUsers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No users match your criteria</h3>
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
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg font-semibold truncate" title={`${user.firstName} ${user.lastName}`}>
                    {user.firstName} {user.lastName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground truncate" title={user.email}>
                    {user.email}
                  </p>
                </div>
              </div>
              <Badge className={`${getUserStatusColor(user.isActive)} w-fit text-xs`}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Shield className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium truncate">{user.role.name}</span>
                </div>
                
                {user.department && (
                  <div className="flex items-center gap-2 text-xs">
                    <Building className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate" title={user.department}>
                      {user.department}
                    </span>
                  </div>
                )}
                
                {user.position && (
                  <div className="flex items-center gap-2 text-xs">
                    <Briefcase className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate" title={user.position}>
                      {user.position}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-1">
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
                  <Link href={`/users/${user.id}`}>
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
                  <Link href={`/users/${user.id}/edit`}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredUsers.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      )}
    </div>
  )
}
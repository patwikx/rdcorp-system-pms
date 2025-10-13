"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createRole, getAllPermissions } from "@/lib/actions/role-actions"
import { CreateRoleSchema, type CreateRoleData } from "@/lib/validations/role-schema"
import type { PermissionOption } from "@/lib/types/role-types"
import { Shield, X, Save, Settings } from "lucide-react"
import { toast } from "sonner"

export function CreateRoleForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [permissions, setPermissions] = useState<PermissionOption[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const router = useRouter()

  const form = useForm<CreateRoleData>({
    resolver: zodResolver(CreateRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: [],
    },
  })

  useEffect(() => {
    async function loadPermissions() {
      try {
        const fetchedPermissions = await getAllPermissions()
        setPermissions(fetchedPermissions)
      } catch (error) {
        console.error('Error loading permissions:', error)
        toast.error('Failed to load permissions')
      }
    }

    loadPermissions()
  }, [])

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = []
    }
    acc[permission.module].push(permission)
    return acc
  }, {} as Record<string, PermissionOption[]>)

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    const newSelected = new Set(selectedPermissions)
    if (checked) {
      newSelected.add(permissionId)
    } else {
      newSelected.delete(permissionId)
    }
    setSelectedPermissions(newSelected)
    form.setValue("permissionIds", Array.from(newSelected))
  }

  const handleModuleToggle = (modulePermissions: PermissionOption[], checked: boolean) => {
    const newSelected = new Set(selectedPermissions)
    modulePermissions.forEach(permission => {
      if (checked) {
        newSelected.add(permission.id)
      } else {
        newSelected.delete(permission.id)
      }
    })
    setSelectedPermissions(newSelected)
    form.setValue("permissionIds", Array.from(newSelected))
  }

  async function onSubmit(data: CreateRoleData) {
    setIsLoading(true)
    try {
      const result = await createRole(data)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Role created successfully")
        router.push("/users/roles")
      }
    } catch (error) {
      console.error("Error creating role:", error)
      toast.error("Failed to create role")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Role Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Role Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter role name" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      A unique name for this role
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the role and its responsibilities" 
                        {...field}
                        disabled={isLoading}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief description of the role&apos;s purpose
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Permissions</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Select the permissions this role should have
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                const allSelected = modulePermissions.every(p => selectedPermissions.has(p.id))
                const someSelected = modulePermissions.some(p => selectedPermissions.has(p.id))
                
                return (
                  <div key={module} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium capitalize">{module.replace('_', ' ')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {modulePermissions.length} permission{modulePermissions.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          {allSelected ? 'All' : someSelected ? 'Some' : 'None'}
                        </span>
                        <Switch
                          checked={allSelected}
                          onCheckedChange={(checked) => handleModuleToggle(modulePermissions, checked)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-4">
                      {modulePermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {permission.action}
                            </div>
                            {permission.description && (
                              <div className="text-xs text-muted-foreground">
                                {permission.description}
                              </div>
                            )}
                          </div>
                          <Switch
                            checked={selectedPermissions.has(permission.id)}
                            onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked)}
                            disabled={isLoading}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {Object.keys(groupedPermissions).indexOf(module) < Object.keys(groupedPermissions).length - 1 && (
                      <Separator />
                    )}
                  </div>
                )
              })}
              
              {permissions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No permissions available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/users/roles")}
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Creating..." : "Create Role"}
            </Button>
          </div>
        </form>
      </Form>
  )
}
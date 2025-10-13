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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { updateRole, deleteRole, getAllPermissions } from "@/lib/actions/role-actions"
import { UpdateRoleSchema, type UpdateRoleData } from "@/lib/validations/role-schema"
import type { PermissionOption, RoleWithPermissions } from "@/lib/types/role-types"
import { Shield, X, Save, Settings, Trash2, Lock } from "lucide-react"
import { toast } from "sonner"

interface EditRoleFormProps {
  role: RoleWithPermissions
}

export function EditRoleForm({ role }: EditRoleFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [permissions, setPermissions] = useState<PermissionOption[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(role.permissions.map(rp => rp.permission.id))
  )
  const router = useRouter()

  const form = useForm<UpdateRoleData>({
    resolver: zodResolver(UpdateRoleSchema),
    defaultValues: {
      id: role.id,
      name: role.name,
      description: role.description || "",
      isActive: role.isActive,
      permissionIds: role.permissions.map(rp => rp.permission.id),
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

  async function onSubmit(data: UpdateRoleData) {
    setIsLoading(true)
    try {
      const result = await updateRole(data)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Role updated successfully")
        router.push("/users/roles")
      }
    } catch (error) {
      console.error("Error updating role:", error)
      toast.error("Failed to update role")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const result = await deleteRole(role.id)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Role deleted successfully")
        router.push("/users/roles")
      }
    } catch (error) {
      console.error("Error deleting role:", error)
      toast.error("Failed to delete role")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Role Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {role.isSystem ? (
                  <Lock className="h-5 w-5" />
                ) : (
                  <Shield className="h-5 w-5" />
                )}
                <span>Role Details</span>
                {role.isSystem && (
                  <span className="text-sm text-muted-foreground">(System Role)</span>
                )}
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
                        disabled={isLoading || role.isSystem}
                      />
                    </FormControl>
                    <FormDescription>
                      {role.isSystem ? "System role names cannot be modified" : "A unique name for this role"}
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

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Inactive roles cannot be assigned to users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading || role.isSystem}
                      />
                    </FormControl>
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
          <div className="flex items-center justify-between">
            <div>
              {!role.isSystem && role._count.users === 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isDeleting ? "Deleting..." : "Delete Role"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Role</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the role &quot;{role.name}&quot;? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
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
                {isLoading ? "Updating..." : "Update Role"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
  )
}
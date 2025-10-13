"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { UpdateUserSchema, type UpdateUserData } from "@/lib/validations/user-schema"
import { updateUser, deleteUser, type UserWithRole } from "@/lib/actions/user-actions"
import { getRoles } from "@/lib/actions/role-actions"
import type { RoleWithPermissions } from "@/lib/types/role-types"
import { User, X, Save, Mail, Building, Briefcase, Shield, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface EditUserFormProps {
  user: UserWithRole
}

export function EditUserForm({ user }: EditUserFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [roles, setRoles] = useState<RoleWithPermissions[]>([])
  const router = useRouter()

  const form = useForm<UpdateUserData>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: user.role.id,
      department: user.department || "",
      position: user.position || "",
      isActive: user.isActive,
    },
  })

  useEffect(() => {
    async function loadRoles() {
      try {
        const fetchedRoles = await getRoles()
        setRoles(fetchedRoles)
      } catch (error) {
        console.error('Error loading roles:', error)
        toast.error('Failed to load roles')
      }
    }

    loadRoles()
  }, [])

  async function onSubmit(data: UpdateUserData) {
    setIsLoading(true)
    try {
      const result = await updateUser(data)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("User updated successfully")
        router.push(`/users/${user.id}`)
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Failed to update user")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const result = await deleteUser(user.id)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("User deactivated successfully")
        router.push("/users")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to deactivate user")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter first name" 
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        User&apos;s first name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter last name" 
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        User&apos;s last name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Address</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="user@example.com" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be used for login
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Work Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Department and Position Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Building className="h-4 w-4" />
                        <span>Department</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., IT, HR, Finance" 
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        User&apos;s department (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Briefcase className="h-4 w-4" />
                        <span>Position</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Manager, Developer" 
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        User&apos;s job position (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Role Selection */}
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>Role</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center space-x-2">
                              <span>{role.name}</span>
                              {role.isSystem && (
                                <span className="text-xs text-muted-foreground">(System)</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Assign a role to determine user permissions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Active Status */}

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Inactive users cannot log in to the system
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? "Deactivating..." : "Deactivate User"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to deactivate &quot;{user.firstName} {user.lastName}&quot;? 
                      They will no longer be able to access the system.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Deactivate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/users/${user.id}`)}
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Updating..." : "Update User"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateUserSchema, type CreateUserData } from "@/lib/validations/user-schema"
import { createUser } from "@/lib/actions/user-actions"
import { getRoles } from "@/lib/actions/role-actions"
import type { RoleWithPermissions } from "@/lib/types/role-types"
import { User, X, Save, Mail, Lock, Building, Briefcase, Shield } from "lucide-react"
import { toast } from "sonner"

export function CreateUserForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<RoleWithPermissions[]>([])
  const router = useRouter()

  const form = useForm<CreateUserData>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      roleId: "",
      department: "",
      position: "",
    },
  })

  useEffect(() => {
    async function loadRoles() {
      try {
        const fetchedRoles = await getRoles()
        setRoles(fetchedRoles.filter(role => role.isActive))
      } catch (error) {
        console.error('Error loading roles:', error)
        toast.error('Failed to load roles')
      }
    }

    loadRoles()
  }, [])

  async function onSubmit(data: CreateUserData) {
    setIsLoading(true)
    try {
      const result = await createUser(data)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("User created successfully")
        router.push("/users")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast.error("Failed to create user")
    } finally {
      setIsLoading(false)
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

            {/* Email and Password Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span>Password</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Enter secure password" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum 6 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/users")}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
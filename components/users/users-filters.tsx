"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Search } from "lucide-react"

export function UsersFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [status, setStatus] = useState(searchParams.get("status") || "")
  const [role, setRole] = useState(searchParams.get("role") || "")
  const [department, setDepartment] = useState(searchParams.get("department") || "")

  useEffect(() => {
    const params = new URLSearchParams()
    
    if (search) params.set("search", search)
    if (status) params.set("status", status)
    if (role) params.set("role", role)
    if (department) params.set("department", department)
    
    const queryString = params.toString()
    const url = queryString ? `/users?${queryString}` : "/users"
    
    router.push(url)
  }, [search, status, role, department, router])

  const clearFilters = () => {
    setSearch("")
    setStatus("")
    setRole("")
    setDepartment("")
  }

  const hasFilters = search || status || role || department

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-status">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-roles">All Roles</SelectItem>
            <SelectItem value="Super Admin">Super Admin</SelectItem>
            <SelectItem value="Property Manager">Property Manager</SelectItem>
            <SelectItem value="Viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>

        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-departments">All Departments</SelectItem>
            <SelectItem value="IT">IT</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Operations">Operations</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
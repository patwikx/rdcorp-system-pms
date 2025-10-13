"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Search } from "lucide-react"

export function SystemSettingsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "")
  const [status, setStatus] = useState(searchParams.get("status") || "")

  useEffect(() => {
    const params = new URLSearchParams()
    
    if (search) params.set("search", search)
    if (category) params.set("category", category)
    if (status) params.set("status", status)
    
    const queryString = params.toString()
    const url = queryString ? `/admin/settings?${queryString}` : "/admin/settings"
    
    router.push(url)
  }, [search, category, status, router])

  const clearFilters = () => {
    setSearch("")
    setCategory("")
    setStatus("")
  }

  const hasFilters = search || category || status

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search settings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-categories">All Categories</SelectItem>
            <SelectItem value="app">Application</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="database">Database</SelectItem>
            <SelectItem value="api">API</SelectItem>
            <SelectItem value="ui">User Interface</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>

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
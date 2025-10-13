"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MovementStatus } from "@prisma/client"
import { X, Search } from "lucide-react"

// Status colors mapping
const statusColors = {
  [MovementStatus.RELEASED]: "bg-blue-500",
  [MovementStatus.IN_TRANSIT]: "bg-yellow-500",
  [MovementStatus.RECEIVED]: "bg-purple-500",
  [MovementStatus.RETURNED]: "bg-green-500",
  [MovementStatus.LOST]: "bg-red-500",
  [MovementStatus.PENDING_RETURN]: "bg-orange-500",
}

export function TitleMovementsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [status, setStatus] = useState(searchParams.get("status") || "")
  const [search, setSearch] = useState(searchParams.get("search") || "")

  useEffect(() => {
    const params = new URLSearchParams()
    
    if (status) params.set("status", status)
    if (search) params.set("search", search)
    
    const queryString = params.toString()
    const url = queryString ? `/title-movements?${queryString}` : "/title-movements"
    
    router.push(url)
  }, [status, search, router])

  const clearFilters = () => {
    setStatus("")
    setSearch("")
  }

  const hasFilters = status || search

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search title movements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Movement Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-statuses">All Statuses</SelectItem>
            {Object.values(MovementStatus).map((movementStatus) => (
              <SelectItem key={movementStatus} value={movementStatus}>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${statusColors[movementStatus]}`} />
                  <span>{movementStatus.replace('_', ' ')}</span>
                </div>
              </SelectItem>
            ))}
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
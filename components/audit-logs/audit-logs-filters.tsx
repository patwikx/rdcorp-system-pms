'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { AuditAction } from "@prisma/client"

const auditActions = Object.values(AuditAction)
const entityTypes = [
  "Property",
  "TitleMovement", 
  "RealPropertyTax",
  "ApprovalWorkflow",
  "User",
  "PropertyDocument"
]

export function AuditLogsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [action, setAction] = useState(searchParams.get("action") || "")
  const [entityType, setEntityType] = useState(searchParams.get("entityType") || "")
  const [userId, setUserId] = useState(searchParams.get("userId") || "")
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(
    searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined
  )

  const applyFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams()
      
      if (search) params.set("search", search)
      if (action) params.set("action", action)
      if (entityType) params.set("entityType", entityType)
      if (userId) params.set("userId", userId)
      if (dateFrom) params.set("dateFrom", format(dateFrom, "yyyy-MM-dd"))
      if (dateTo) params.set("dateTo", format(dateTo, "yyyy-MM-dd"))
      
      router.push(`/audit-logs?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    setSearch("")
    setAction("")
    setEntityType("")
    setUserId("")
    setDateFrom(undefined)
    setDateTo(undefined)
    
    startTransition(() => {
      router.push("/audit-logs")
    })
  }

  const hasActiveFilters = search || action || entityType || userId || dateFrom || dateTo

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by entity ID or IP address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-actions">All Actions</SelectItem>
                {auditActions.map((actionItem) => (
                  <SelectItem key={actionItem} value={actionItem}>
                    {actionItem.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entityType">Entity Type</Label>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger>
                <SelectValue placeholder="Select entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Types</SelectItem>
                {entityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              placeholder="Enter user ID..."
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Date From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Date To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t">
          <Button onClick={applyFilters} disabled={isPending}>
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} disabled={isPending}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
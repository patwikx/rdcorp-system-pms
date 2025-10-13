"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PropertyClassification, PropertyStatus } from "@prisma/client"
import { 
  Search, 
  X,
  Home,
  Building2,
  Factory,
  Wheat,
  Layers,
  School
} from "lucide-react"

// Classification icons mapping
const classificationIcons = {
  [PropertyClassification.RESIDENTIAL]: Home,
  [PropertyClassification.COMMERCIAL]: Building2,
  [PropertyClassification.INDUSTRIAL]: Factory,
  [PropertyClassification.AGRICULTURAL]: Wheat,
  [PropertyClassification.MIXED_USE]: Layers,
  [PropertyClassification.INSTITUTIONAL]: School,
}

// Status colors mapping
const statusColors = {
  [PropertyStatus.ACTIVE]: "bg-green-500",
  [PropertyStatus.COLLATERAL]: "bg-yellow-500",
  [PropertyStatus.SOLD]: "bg-blue-500",
  [PropertyStatus.UNDER_DEVELOPMENT]: "bg-purple-500",
  [PropertyStatus.FORECLOSED]: "bg-red-500",
  [PropertyStatus.DISPOSED]: "bg-gray-500",
  [PropertyStatus.PENDING_TRANSFER]: "bg-orange-500",
  [PropertyStatus.INACTIVE]: "bg-gray-400",
}

export function PropertiesFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [classification, setClassification] = useState(searchParams.get("classification") || "")
  const [status, setStatus] = useState(searchParams.get("status") || "")

  useEffect(() => {
    const params = new URLSearchParams()
    
    if (search) params.set("search", search)
    if (classification) params.set("classification", classification)
    if (status) params.set("status", status)
    
    const queryString = params.toString()
    const url = queryString ? `/properties?${queryString}` : "/properties"
    
    router.push(url)
  }, [search, classification, status, router])

  const clearFilters = () => {
    setSearch("")
    setClassification("")
    setStatus("")
  }

  const hasFilters = search || classification || status

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties by title, owner, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={classification} onValueChange={setClassification}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Classification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-classifications">All Classifications</SelectItem>
            {Object.values(PropertyClassification).map((classification) => {
              const Icon = classificationIcons[classification]
              return (
                <SelectItem key={classification} value={classification}>
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{classification.replace('_', ' ')}</span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-statuses">All Statuses</SelectItem>
            {Object.values(PropertyStatus).map((status) => (
              <SelectItem key={status} value={status}>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
                  <span>{status.replace('_', ' ')}</span>
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
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DocumentType } from "@prisma/client"
import { X, Search } from "lucide-react"

// Document type display names
const documentTypeLabels = {
  [DocumentType.TITLE_DEED]: "Title Deed",
  [DocumentType.TAX_DECLARATION]: "Tax Declaration",
  [DocumentType.TAX_RECEIPT]: "Tax Receipt",
  [DocumentType.SURVEY_PLAN]: "Survey Plan",
  [DocumentType.MORTGAGE_CONTRACT]: "Mortgage Contract",
  [DocumentType.SALE_AGREEMENT]: "Sale Agreement",
  [DocumentType.LEASE_AGREEMENT]: "Lease Agreement",
  [DocumentType.APPRAISAL_REPORT]: "Appraisal Report",
  [DocumentType.PHOTO]: "Photo",
  [DocumentType.OTHER]: "Other"
}

export function DocumentsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [documentType, setDocumentType] = useState(searchParams.get("documentType") || "")

  useEffect(() => {
    const params = new URLSearchParams()
    
    if (search) params.set("search", search)
    if (documentType) params.set("documentType", documentType)
    
    const queryString = params.toString()
    const url = queryString ? `/documents?${queryString}` : "/documents"
    
    router.push(url)
  }, [search, documentType, router])

  const clearFilters = () => {
    setSearch("")
    setDocumentType("")
  }

  const hasFilters = search || documentType

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={documentType} onValueChange={setDocumentType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Document Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-types">All Types</SelectItem>
            {Object.entries(documentTypeLabels).map(([type, label]) => (
              <SelectItem key={type} value={type}>
                {label}
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
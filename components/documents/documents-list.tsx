"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getAllDocuments, type PropertyDocumentWithDetails } from "@/lib/actions/document-actions"
import { DocumentType } from "@prisma/client"
import { 
  FileText, 
  Receipt, 
  MapPin, 
  FileImage,
  FileCheck,
  Handshake,
  Building,
  TrendingUp,
  Folder,
  Download,
  Eye,
  Calendar,
  MapPinIcon,
  User
} from "lucide-react"
import { toast } from "sonner"

interface DocumentsListProps {
  searchParams: Promise<{
    search?: string
    documentType?: string
    page?: string
  }>
}

// Document type icons
const documentTypeIcons = {
  [DocumentType.TITLE_DEED]: FileText,
  [DocumentType.TAX_DECLARATION]: Receipt,
  [DocumentType.TAX_RECEIPT]: Receipt,
  [DocumentType.SURVEY_PLAN]: MapPin,
  [DocumentType.MORTGAGE_CONTRACT]: FileCheck,
  [DocumentType.SALE_AGREEMENT]: Handshake,
  [DocumentType.LEASE_AGREEMENT]: Building,
  [DocumentType.APPRAISAL_REPORT]: TrendingUp,
  [DocumentType.PHOTO]: FileImage,
  [DocumentType.OTHER]: Folder
}

// Document type colors
const documentTypeColors = {
  [DocumentType.TITLE_DEED]: "bg-blue-100 text-blue-800 border-blue-200",
  [DocumentType.TAX_DECLARATION]: "bg-green-100 text-green-800 border-green-200",
  [DocumentType.TAX_RECEIPT]: "bg-emerald-100 text-emerald-800 border-emerald-200",
  [DocumentType.SURVEY_PLAN]: "bg-purple-100 text-purple-800 border-purple-200",
  [DocumentType.MORTGAGE_CONTRACT]: "bg-red-100 text-red-800 border-red-200",
  [DocumentType.SALE_AGREEMENT]: "bg-orange-100 text-orange-800 border-orange-200",
  [DocumentType.LEASE_AGREEMENT]: "bg-indigo-100 text-indigo-800 border-indigo-200",
  [DocumentType.APPRAISAL_REPORT]: "bg-cyan-100 text-cyan-800 border-cyan-200",
  [DocumentType.PHOTO]: "bg-pink-100 text-pink-800 border-pink-200",
  [DocumentType.OTHER]: "bg-gray-100 text-gray-800 border-gray-200"
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown size"
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

export function DocumentsList({ searchParams }: DocumentsListProps) {
  const [documents, setDocuments] = useState<PropertyDocumentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<{
    search?: string
    documentType?: string
  }>({})

  useEffect(() => {
    const loadFilters = async () => {
      const params = await searchParams
      setFilters(params)
    }
    loadFilters()
  }, [searchParams])

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const result = await getAllDocuments()
      setDocuments(result)
    } catch (error) {
      console.error("Error loading documents:", error)
      toast.error("Failed to load documents")
    } finally {
      setLoading(false)
    }
  }

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(document => {
    const matchesSearch = !filters.search || 
      document.fileName.toLowerCase().includes(filters.search.toLowerCase()) ||
      document.property.titleNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
      document.property.registeredOwner.toLowerCase().includes(filters.search.toLowerCase()) ||
      (document.description && document.description.toLowerCase().includes(filters.search.toLowerCase()))

    const matchesType = !filters.documentType || 
      filters.documentType === "all-types" || 
      document.documentType === filters.documentType

    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading documents...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No documents found</h3>
          <p className="text-muted-foreground text-center">
            No documents have been uploaded yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (filteredDocuments.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No documents match your criteria</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter settings.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDocuments.map((document) => {
          const Icon = documentTypeIcons[document.documentType]
          
          return (
            <Card key={document.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <CardTitle className="text-sm font-medium truncate" title={document.fileName}>
                      {document.fileName}
                    </CardTitle>
                  </div>
                </div>
                <Badge className={`${documentTypeColors[document.documentType]} w-fit text-xs`}>
                  {document.documentType.replace('_', ' ')}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium truncate">{document.property.titleNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate" title={document.property.registeredOwner}>
                      {document.property.registeredOwner}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <MapPinIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      {document.property.city}, {document.property.province}
                    </span>
                  </div>
                </div>
                
                <div className="pt-2 border-t space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(document.fileSize)}
                  </div>
                </div>
                
                {document.description && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground line-clamp-2" title={document.description}>
                      {document.description}
                    </p>
                  </div>
                )}
                
                <div className="pt-2 flex gap-1">
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {filteredDocuments.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredDocuments.length} of {documents.length} documents
        </div>
      )}
    </div>
  )
}
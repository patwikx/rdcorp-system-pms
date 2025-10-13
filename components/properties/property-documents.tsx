import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Plus, Search, Download, Eye, Calendar, File, Loader2 } from "lucide-react"
import { PropertyWithFullDetails } from "@/lib/actions/property-actions"
import { UploadDocumentForm } from "./upload-document-form"
import { getDocumentDownloadUrl, getDocumentViewUrl } from "@/lib/actions/property-document-actions"
import { format } from "date-fns"
import { toast } from "sonner"

interface PropertyDocumentsProps {
  property: PropertyWithFullDetails
}

export function PropertyDocuments({ property }: PropertyDocumentsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [loadingDocuments, setLoadingDocuments] = useState<Set<string>>(new Set())
  // Removed unused viewerDialog state

  const handleDocumentUploaded = () => {
    setIsUploadDialogOpen(false)
    // Refresh the page or update the property data
    window.location.reload()
  }

  const handleDownload = async (documentId: string) => {
    setLoadingDocuments(prev => new Set(prev).add(documentId))
    
    try {
      const result = await getDocumentDownloadUrl(documentId)
      
      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.data) {
        // Create a temporary link element to trigger download
        const link = document.createElement('a')
        link.href = result.data.url
        link.download = result.data.fileName
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('Download started')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download document')
    } finally {
      setLoadingDocuments(prev => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    }
  }

  const handleView = async (documentId: string) => {
    setLoadingDocuments(prev => new Set(prev).add(documentId))
    
    try {
      const result = await getDocumentViewUrl(documentId)
      
      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.data) {
        // Open the document in a new tab/window
        const newWindow = window.open(result.data.url, '_blank')
        
        if (!newWindow) {
          toast.error('Please allow popups to view documents')
        } else {
          toast.success('Document opened in new tab')
        }
      }
    } catch (error) {
      console.error('View error:', error)
      toast.error('Failed to view document')
    } finally {
      setLoadingDocuments(prev => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    }
  }

  // Get all documents for this property
  const allDocuments = property.documents

  // Filter documents based on search and filters
  const filteredDocuments = allDocuments.filter(document => {
    const matchesSearch = searchTerm === "" || 
      document.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (document.description && document.description.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = filterType === "all" || document.documentType === filterType

    return matchesSearch && matchesType
  })

  // Get unique document types for filter
  const availableTypes = [...new Set(allDocuments.map(document => document.documentType))]

  const getDocumentTypeBadge = (type: string) => {
    const colors = {
      'TITLE': 'bg-blue-100 text-blue-800',
      'TAX_DECLARATION': 'bg-green-100 text-green-800',
      'SURVEY_PLAN': 'bg-purple-100 text-purple-800',
      'DEED_OF_SALE': 'bg-yellow-100 text-yellow-800',
      'MORTGAGE_DOCUMENT': 'bg-red-100 text-red-800',
      'COURT_ORDER': 'bg-orange-100 text-orange-800',
      'PERMIT': 'bg-indigo-100 text-indigo-800',
      'CONTRACT': 'bg-pink-100 text-pink-800',
      'RECEIPT': 'bg-cyan-100 text-cyan-800',
      'OTHER': 'bg-gray-100 text-gray-800',
    }
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return <File className="h-5 w-5 text-red-500" />
      case 'doc':
      case 'docx':
        return <File className="h-5 w-5 text-blue-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <File className="h-5 w-5 text-green-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (allDocuments.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No documents found</h3>
        <p className="mt-2 text-muted-foreground">
          This property doesn&apos;t have any documents uploaded yet.
        </p>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="!w-[700px] !max-w-[700px] !min-w-[700px]" style={{ width: '700px', maxWidth: '700px', minWidth: '700px' }}>
            <DialogHeader>
              <DialogTitle>Upload Property Document</DialogTitle>
            </DialogHeader>
            <UploadDocumentForm 
              propertyId={property.id}
              onSuccess={handleDocumentUploaded}
              onCancel={() => setIsUploadDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Property Documents</CardTitle>
            <CardDescription>Manage all property-related documents and files</CardDescription>
          </div>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{allDocuments.length}</div>
          <p className="text-sm text-muted-foreground">
            Total size: {formatFileSize(allDocuments.reduce((sum, doc) => sum + (doc.fileSize || 0), 0))}
          </p>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <CardDescription>View and manage all uploaded documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium mb-1">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by file name, type, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="min-w-[160px]">
                <Label className="text-sm font-medium">Document Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {availableTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-end">
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="!w-[700px] !max-w-[700px] !min-w-[700px]" style={{ width: '700px', maxWidth: '700px', minWidth: '700px' }}>
                  <DialogHeader>
                    <DialogTitle>Upload Property Document</DialogTitle>
                  </DialogHeader>
                  <UploadDocumentForm 
                    propertyId={property.id}
                    onSuccess={handleDocumentUploaded}
                    onCancel={() => setIsUploadDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Document Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No documents match your search criteria.</p>
              </div>
            ) : (
              filteredDocuments.map((document) => (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* File Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(document.fileName)}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate" title={document.fileName}>
                              {document.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(document.fileSize || 0)}
                            </p>
                          </div>
                        </div>
                        {getDocumentTypeBadge(document.documentType)}
                      </div>

                      {/* Description */}
                      {document.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {document.description}
                        </p>
                      )}

                      {/* Upload Info */}
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(document.uploadedAt), 'MMM dd, yyyy')}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleView(document.id)}
                          disabled={loadingDocuments.has(document.id)}
                        >
                          {loadingDocuments.has(document.id) ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Eye className="h-3 w-3 mr-1" />
                          )}
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleDownload(document.id)}
                          disabled={loadingDocuments.has(document.id)}
                        >
                          {loadingDocuments.has(document.id) ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3 mr-1" />
                          )}
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {filteredDocuments.length > 0 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {filteredDocuments.length} of {allDocuments.length} documents
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
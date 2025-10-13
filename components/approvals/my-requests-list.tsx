"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getMyApprovalRequests, type ApprovalWorkflowWithDetails } from "@/lib/actions/approval-actions"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  User, 
  ExternalLink, 
  Search,
  Edit,
  Activity,
  RotateCcw,
  Building,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

function getStatusIcon(status: string) {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4" />
    case 'APPROVED':
      return <CheckCircle className="h-4 w-4" />
    case 'REJECTED':
      return <XCircle className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING':
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case 'APPROVED':
      return "bg-green-100 text-green-800 border-green-200"
    case 'REJECTED':
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

function getWorkflowTypeIcon(type: string, size: string = "h-4 w-4") {
  const icons = {
    'PROPERTY_UPDATE': Edit,
    'TITLE_TRANSFER': Activity,
    'STATUS_CHANGE': RotateCcw,
    'OWNER_CHANGE': User,
    'ENCUMBRANCE_UPDATE': FileText,
    'LOCATION_UPDATE': Building,
    'DELETION': Trash2,
    'RESTORATION': RotateCcw,
  }
  const Icon = icons[type as keyof typeof icons] || FileText
  return <Icon className={`${size} text-muted-foreground`} />
}

export function MyRequestsList() {
  const [requests, setRequests] = useState<ApprovalWorkflowWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const result = await getMyApprovalRequests()
      setRequests(result)
    } catch (error) {
      console.error("Error loading requests:", error)
      toast.error("Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  // Filter requests based on search and filters
  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchTerm === "" || 
      request.property.titleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.property.registeredOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.workflowType.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || request.status === filterStatus
    const matchesType = filterType === "all" || request.workflowType === filterType

    return matchesSearch && matchesStatus && matchesType
  })

  // Get unique statuses and types for filters
  const availableStatuses = [...new Set(requests.map(request => request.status))]
  const availableTypes = [...new Set(requests.map(request => request.workflowType))]

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading requests...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No requests found</h3>
          <p className="text-muted-foreground text-center">
            You haven&apos;t submitted any approval requests yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium mb-1">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title number, owner, description, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="min-w-[140px]">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span>All Status</span>
                      </div>
                    </SelectItem>
                    {availableStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            status === 'PENDING' ? 'bg-amber-400' :
                            status === 'APPROVED' ? 'bg-green-400' :
                            status === 'REJECTED' ? 'bg-red-400' :
                            status === 'CANCELLED' ? 'bg-gray-400' :
                            status === 'EXPIRED' ? 'bg-purple-400' :
                            'bg-gray-400'
                          }`}></div>
                          <span>{status}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="min-w-[160px]">
                <Label className="text-sm font-medium">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span>All Types</span>
                      </div>
                    </SelectItem>
                    {availableTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center space-x-2">
                          {getWorkflowTypeIcon(type, "h-3 w-3")}
                          <span>{type.replace('_', ' ')}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No requests match your criteria</h3>
          <p className="mt-2 text-muted-foreground">
            Try adjusting your search or filter settings.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRequests.map((request) => (
            <Link key={request.id} href={`/approvals/my-requests/${request.id}`}>
              <Card className="relative hover:shadow-lg transition-all duration-200 cursor-pointer h-full group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                        {getWorkflowTypeIcon(request.workflowType, "h-4 w-4")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm leading-tight truncate">
                          {request.workflowType.replace('_', ' ')}
                        </CardTitle>
                        <div className="text-xs text-muted-foreground truncate">
                          {request.property.titleNumber}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(request.status)}`}>
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3 pt-0">
                  {/* Property Owner */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Building className="h-3 w-3" />
                      <span>Owner</span>
                    </div>
                    <p className="font-medium text-xs truncate">{request.property.registeredOwner}</p>
                  </div>

                  {/* Requester */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>Requested By</span>
                    </div>
                    <p className="font-medium text-xs truncate">
                      {request.initiatedBy.firstName} {request.initiatedBy.lastName}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Submitted</span>
                    </div>
                    <p className="text-xs">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Description</div>
                    <p className="text-xs bg-muted/50 p-2 rounded text-muted-foreground line-clamp-2">
                      {request.description}
                    </p>
                  </div>

                  {/* Rejection Reason */}
                  {request.status === 'REJECTED' && request.rejectedReason && (
                    <div className="space-y-1">
                      <div className="text-xs text-red-600 font-medium">Rejected</div>
                      <p className="text-xs bg-red-50 p-2 rounded text-red-700 line-clamp-2">
                        {request.rejectedReason}
                      </p>
                    </div>
                  )}

                  {/* Processed By */}
                  {request.approvedBy && (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <CheckCircle className="h-3 w-3" />
                        <span>Processed By</span>
                      </div>
                      <p className="text-xs truncate">
                        {request.approvedBy.firstName} {request.approvedBy.lastName}
                      </p>
                    </div>
                  )}
                </CardContent>

                {/* Status Indicator */}
                {request.status === 'PENDING' && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {filteredRequests.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredRequests.length} of {requests.length} requests
        </div>
      )}
    </div>
  )
}
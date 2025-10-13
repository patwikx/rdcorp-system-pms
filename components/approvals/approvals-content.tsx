"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Calendar, 
  User, 
  FileText, 
  AlertTriangle,
  Building,
  Activity,
  Edit,
  Trash2,
  RotateCcw
} from "lucide-react"
import { getAllApprovalWorkflows, getApprovalStats } from "@/lib/actions/approval-actions"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"

interface ApprovalWorkflowWithDetails {
  id: string
  propertyId: string
  workflowType: string
  description: string
  status: string
  priority: string
  proposedChanges: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  approvedAt: Date | null
  rejectedReason: string | null
  property: {
    id: string
    titleNumber: string
    registeredOwner: string
    location?: string | null
  }
  initiatedBy: {
    id: string
    firstName: string
    lastName: string
  }
  approvedBy: {
    id: string
    firstName: string
    lastName: string
  } | null
}

interface ApprovalStats {
  pending: number
  approvedToday: number
  rejectedToday: number
}

export function ApprovalsContent() {
  const [approvals, setApprovals] = useState<ApprovalWorkflowWithDetails[]>([])
  const [stats, setStats] = useState<ApprovalStats>({ pending: 0, approvedToday: 0, rejectedToday: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")


  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [approvalsData, statsData] = await Promise.all([
        getAllApprovalWorkflows(),
        getApprovalStats()
      ])
      setApprovals(approvalsData)
      setStats(statsData)
    } catch (error) {
      console.error("Error loading approvals:", error)
      toast.error("Failed to load approval data")
    } finally {
      setIsLoading(false)
    }
  }



  // Filter approvals
  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = searchTerm === "" || 
      approval.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.property.titleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.property.registeredOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${approval.initiatedBy.firstName} ${approval.initiatedBy.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || approval.status === filterStatus
    const matchesType = filterType === "all" || approval.workflowType === filterType
    const matchesPriority = filterPriority === "all" || approval.priority === filterPriority

    return matchesSearch && matchesStatus && matchesType && matchesPriority
  })

  const getStatusBadge = (status: string) => {
    const colors = {
      'PENDING': 'bg-amber-100 text-amber-800 border-amber-200',
      'APPROVED': 'bg-green-100 text-green-800 border-green-200',
      'REJECTED': 'bg-red-100 text-red-800 border-red-200',
      'CANCELLED': 'bg-gray-100 text-gray-800 border-gray-200',
      'EXPIRED': 'bg-purple-100 text-purple-800 border-purple-200',
    }
    return (
      <Badge variant="outline" className={`text-xs px-2 py-0.5 ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'LOW': 'bg-blue-100 text-blue-800',
      'NORMAL': 'bg-gray-100 text-gray-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800',
    }
    return (
      <Badge className={`text-xs px-2 py-0.5 ${colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {priority}
      </Badge>
    )
  }

  const getWorkflowTypeIcon = (type: string) => {
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
    return <Icon className="h-4 w-4" />
  }

  const getWorkflowTypeLabel = (type: string) => {
    const labels = {
      'PROPERTY_UPDATE': 'Property Update',
      'TITLE_TRANSFER': 'Title Transfer',
      'STATUS_CHANGE': 'Status Change',
      'OWNER_CHANGE': 'Owner Change',
      'ENCUMBRANCE_UPDATE': 'Encumbrance Update',
      'LOCATION_UPDATE': 'Location Update',
      'DELETION': 'Deletion Request',
      'RESTORATION': 'Restoration Request',
    }
    return labels[type as keyof typeof labels] || type
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="animate-pulse space-y-2">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-96"></div>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Updated Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedToday}</div>
            <p className="text-xs text-muted-foreground">Processed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejectedToday}</div>
            <p className="text-xs text-muted-foreground">Declined today</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Requests</CardTitle>
          <CardDescription>Review and manage all approval workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium mb-1">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by description, property, owner, or requester..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="min-w-[120px]">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span>All Status</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="PENDING">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                        <span>Pending</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="APPROVED">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span>Approved</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="REJECTED">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        <span>Rejected</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="CANCELLED">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span>Cancelled</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="EXPIRED">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                        <span>Expired</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[140px]">
                <Label className="text-sm font-medium">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span>All Types</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="PROPERTY_UPDATE">
                      <div className="flex items-center space-x-2">
                        <Edit className="h-3 w-3 text-muted-foreground" />
                        <span>Property Update</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="TITLE_TRANSFER">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                        <span>Title Transfer</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="STATUS_CHANGE">
                      <div className="flex items-center space-x-2">
                        <RotateCcw className="h-3 w-3 text-muted-foreground" />
                        <span>Status Change</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="OWNER_CHANGE">
                      <div className="flex items-center space-x-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>Owner Change</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ENCUMBRANCE_UPDATE">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span>Encumbrance Update</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="LOCATION_UPDATE">
                      <div className="flex items-center space-x-2">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        <span>Location Update</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="DELETION">
                      <div className="flex items-center space-x-2">
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                        <span>Deletion</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="RESTORATION">
                      <div className="flex items-center space-x-2">
                        <RotateCcw className="h-3 w-3 text-muted-foreground" />
                        <span>Restoration</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[120px]">
                <Label className="text-sm font-medium">Priority</Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span>All Priority</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="LOW">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span>Low</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="NORMAL">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span>Normal</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="HIGH">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span>High</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="URGENT">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        <span>Urgent</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Approval Grid */}
          {filteredApprovals.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No approval requests found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchTerm || filterStatus !== "all" || filterType !== "all" || filterPriority !== "all"
                  ? "No requests match your search criteria."
                  : "There are no approval requests at this time."
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredApprovals.map((approval) => (
                <Link key={approval.id} href={`/approvals/${approval.id}`}>
                  <Card className="relative hover:shadow-lg transition-all duration-200 cursor-pointer h-full group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                            {getWorkflowTypeIcon(approval.workflowType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm leading-tight truncate">
                              {getWorkflowTypeLabel(approval.workflowType)}
                            </CardTitle>
                            <CardDescription className="text-xs truncate">
                              {approval.property.titleNumber}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {getStatusBadge(approval.status)}
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
                        <p className="font-medium text-xs truncate">{approval.property.registeredOwner}</p>
                      </div>

                      {/* Requester */}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>Requested By</span>
                        </div>
                        <p className="font-medium text-xs truncate">
                          {approval.initiatedBy.firstName} {approval.initiatedBy.lastName}
                        </p>
                      </div>

                      {/* Date */}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Date</span>
                        </div>
                        <p className="text-xs">
                          {format(new Date(approval.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>

                      {/* Priority */}
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Priority</div>
                        {getPriorityBadge(approval.priority)}
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Changes</div>
                        <p className="text-xs bg-muted/50 p-2 rounded text-muted-foreground line-clamp-2">
                          {approval.description}
                        </p>
                      </div>

                      {/* Rejection Reason */}
                      {approval.rejectedReason && (
                        <div className="space-y-1">
                          <div className="text-xs text-red-600 font-medium">Rejected</div>
                          <p className="text-xs bg-red-50 p-2 rounded text-red-700 line-clamp-2">
                            {approval.rejectedReason}
                          </p>
                        </div>
                      )}

                      {/* Processed By */}
                      {approval.approvedBy && (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <CheckCircle className="h-3 w-3" />
                            <span>Processed By</span>
                          </div>
                          <p className="text-xs truncate">
                            {approval.approvedBy.firstName} {approval.approvedBy.lastName}
                          </p>
                        </div>
                      )}
                    </CardContent>

                    {/* Status Indicator */}
                    {approval.status === 'PENDING' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {filteredApprovals.length > 0 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {filteredApprovals.length} of {approvals.length} approval requests
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  )
}
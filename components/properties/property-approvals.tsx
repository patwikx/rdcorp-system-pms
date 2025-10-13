'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckSquare, Plus, Search, Clock, CheckCircle, XCircle, AlertCircle, User, Calendar } from "lucide-react"
import { PropertyWithFullDetails } from "@/lib/actions/property-actions"
import { ApprovalDecisionDialog } from "./approval-decision-dialog"
import { format } from "date-fns"

interface PropertyApprovalsProps {
  property: PropertyWithFullDetails
}

export function PropertyApprovals({ property }: PropertyApprovalsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [approvingWorkflow, setApprovingWorkflow] = useState<typeof allApprovals[0] | null>(null)

  const handleApprovalDecision = () => {
    setIsApprovalDialogOpen(false)
    setApprovingWorkflow(null)
    // Refresh the page or update the property data
    window.location.reload()
  }

  const handleApproveWorkflow = (approval: typeof allApprovals[0]) => {
    setApprovingWorkflow(approval)
    setIsApprovalDialogOpen(true)
  }

  // Get all approval workflows for this property
  const allApprovals = property.approvalWorkflows

  // Filter approvals based on search and filters
  const filteredApprovals = allApprovals.filter(approval => {
    const matchesSearch = searchTerm === "" || 
      approval.workflowType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.initiatedBy.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.initiatedBy.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (approval.description && approval.description.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = filterStatus === "all" || approval.status === filterStatus
    const matchesType = filterType === "all" || approval.workflowType === filterType

    return matchesSearch && matchesStatus && matchesType
  })

  // Get unique workflow types and statuses for filters
  const availableTypes = [...new Set(allApprovals.map(approval => approval.workflowType))]
  const availableStatuses = [...new Set(allApprovals.map(approval => approval.status))]

  // Calculate summary statistics
  const pendingApprovals = allApprovals.filter(approval => approval.status === 'PENDING').length
  const approvedApprovals = allApprovals.filter(approval => approval.status === 'APPROVED').length
  const rejectedApprovals = allApprovals.filter(approval => approval.status === 'REJECTED').length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'APPROVED':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'IN_REVIEW':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><AlertCircle className="h-3 w-3 mr-1" />In Review</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getWorkflowTypeBadge = (type: string) => {
    const colors = {
      'PROPERTY_TRANSFER': 'bg-blue-100 text-blue-800',
      'MORTGAGE_APPROVAL': 'bg-green-100 text-green-800',
      'SUBDIVISION_APPROVAL': 'bg-purple-100 text-purple-800',
      'DEVELOPMENT_PERMIT': 'bg-yellow-100 text-yellow-800',
      'TAX_EXEMPTION': 'bg-red-100 text-red-800',
      'TITLE_CORRECTION': 'bg-orange-100 text-orange-800',
      'FORECLOSURE_APPROVAL': 'bg-indigo-100 text-indigo-800',
      'OTHER': 'bg-gray-100 text-gray-800',
    }
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  if (allApprovals.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No approval workflows found</h3>
        <p className="mt-2 text-muted-foreground">
          This property doesn&apos;t have any approval workflows yet.
        </p>
        <Button className="mt-4" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allApprovals.length}</div>
            <p className="text-xs text-muted-foreground">All approval requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedApprovals}</div>
            <p className="text-xs text-muted-foreground">Successfully approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedApprovals}</div>
            <p className="text-xs text-muted-foreground">Rejected requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Workflows</CardTitle>
          <CardDescription>Manage and track all approval processes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium mb-1">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by workflow type, requester, or description..."
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
                    <SelectItem value="all">All Status</SelectItem>
                    {availableStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="min-w-[160px]">
                <Label className="text-sm font-medium">Workflow Type</Label>
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
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Workflow
              </Button>
            </div>
          </div>

          {/* Approval Records */}
          <div className="space-y-4">
            {filteredApprovals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No approval workflows match your search criteria.</p>
              </div>
            ) : (
              filteredApprovals.map((approval) => (
                <Card key={approval.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Approval Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            {getWorkflowTypeBadge(approval.workflowType)}
                            {getStatusBadge(approval.status)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>Requested by {approval.initiatedBy.firstName} {approval.initiatedBy.lastName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{format(new Date(approval.createdAt), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>

                      {/* Description */}
                      {approval.description && (
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-muted-foreground">Description</div>
                          <p className="text-sm bg-muted/50 p-3 rounded-md">{approval.description}</p>
                        </div>
                      )}

                      {/* Approval Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {approval.approvedBy && (
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground">Approved By</div>
                            <p className="text-sm font-semibold">
                              {approval.approvedBy.firstName} {approval.approvedBy.lastName}
                            </p>
                            {approval.approvedAt && (
                              <p className="text-xs text-muted-foreground">
                                on {format(new Date(approval.approvedAt), 'MMM dd, yyyy HH:mm')}
                              </p>
                            )}
                          </div>
                        )}

                        {approval.status === 'REJECTED' && (
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground">Rejected</div>
                            <p className="text-xs text-muted-foreground">
                              on {format(new Date(approval.updatedAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Rejection Reason */}
                      {approval.rejectedReason && (
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-muted-foreground">Rejection Reason</div>
                          <p className="text-sm bg-red-50 border border-red-200 p-3 rounded-md text-red-800">
                            {approval.rejectedReason}
                          </p>
                        </div>
                      )}

                      {/* Actions for pending approvals */}
                      {approval.status === 'PENDING' && (
                        <div className="flex space-x-2 pt-2 border-t">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveWorkflow(approval)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Review & Decide
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {filteredApprovals.length > 0 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {filteredApprovals.length} of {allApprovals.length} approval workflows
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Decision Dialog */}
      {approvingWorkflow && (
        <ApprovalDecisionDialog
          isOpen={isApprovalDialogOpen}
          onOpenChange={setIsApprovalDialogOpen}
          workflowId={approvingWorkflow.id}
          workflowType={approvingWorkflow.workflowType}
          workflowDescription={approvingWorkflow.description}
          priority={approvingWorkflow.priority}
          propertyTitle={property.titleNumber}
          propertyOwner={property.registeredOwner}
          propertyLocation={property.location || undefined}
          requestedBy={`${approvingWorkflow.initiatedBy.firstName} ${approvingWorkflow.initiatedBy.lastName}`}
          requestedAt={approvingWorkflow.createdAt}
          proposedChanges={approvingWorkflow.proposedChanges as Record<string, unknown>}
          onSuccess={handleApprovalDecision}
        />
      )}
    </div>
  )
}
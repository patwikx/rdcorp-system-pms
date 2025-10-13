"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  RotateCcw, 
  Search, 
  Calendar, 
  User, 
  Building, 
  AlertTriangle,
  Clock,
  CheckCircle
} from "lucide-react"
import { getReturnableTitleMovements } from "@/lib/actions/title-movement-actions"
import { TitleReturnForm } from "@/components/properties/title-return-form"
import { format, differenceInDays } from "date-fns"
import { toast } from "sonner"

interface TitleMovementWithDetails {
  id: string
  propertyId: string
  dateReleased: Date | null
  releasedBy: string | null
  receivedByName: string | null
  receivedByTransmittal: string | null
  movementStatus: string
  createdAt: Date
  property: {
    id: string
    titleNumber: string
    registeredOwner: string
  }
  movedBy: {
    id: string
    firstName: string
    lastName: string
  }
}

export function ReturnableTitlesContent() {
  const [movements, setMovements] = useState<TitleMovementWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedMovement, setSelectedMovement] = useState<TitleMovementWithDetails | null>(null)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)

  useEffect(() => {
    loadReturnableMovements()
  }, [])

  const loadReturnableMovements = async () => {
    setIsLoading(true)
    try {
      const data = await getReturnableTitleMovements()
      setMovements(data)
    } catch (error) {
      console.error("Error loading returnable movements:", error)
      toast.error("Failed to load returnable titles")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReturnSuccess = () => {
    setIsReturnDialogOpen(false)
    setSelectedMovement(null)
    loadReturnableMovements() // Refresh data
  }

  const handleProcessReturn = (movement: TitleMovementWithDetails) => {
    setSelectedMovement(movement)
    setIsReturnDialogOpen(true)
  }

  // Filter movements
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = searchTerm === "" || 
      movement.property.titleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.property.registeredOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movement.releasedBy && movement.releasedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (movement.receivedByName && movement.receivedByName.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = filterStatus === "all" || movement.movementStatus === filterStatus

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const colors = {
      'RELEASED': 'bg-blue-100 text-blue-800 border-blue-200',
      'IN_TRANSIT': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'RECEIVED': 'bg-green-100 text-green-800 border-green-200',
      'PENDING_RETURN': 'bg-orange-100 text-orange-800 border-orange-200',
    }
    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getDaysOut = (dateReleased: Date | null) => {
    if (!dateReleased) return 0
    return differenceInDays(new Date(), new Date(dateReleased))
  }

  const isOverdue = (dateReleased: Date | null) => {
    return getDaysOut(dateReleased) > 30 // Consider overdue after 30 days
  }

  const getUrgencyIndicator = (movement: TitleMovementWithDetails) => {
    const daysOut = getDaysOut(movement.dateReleased)
    if (daysOut > 60) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    } else if (daysOut > 30) {
      return <Clock className="h-4 w-4 text-amber-500" />
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />
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
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Titles Out</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{movements.length}</div>
            <p className="text-xs text-muted-foreground">Currently released</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Returns</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {movements.filter(m => isOverdue(m.dateReleased)).length}
            </div>
            <p className="text-xs text-muted-foreground">Past expected return</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Days Out</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {movements.length > 0 
                ? Math.round(movements.reduce((sum, m) => sum + getDaysOut(m.dateReleased), 0) / movements.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">Days on average</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Returnable Titles</CardTitle>
          <CardDescription>Process returns for titles currently in circulation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium mb-1">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by property, owner, or person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="min-w-[160px]">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="RELEASED">Released</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="RECEIVED">Received</SelectItem>
                  <SelectItem value="PENDING_RETURN">Pending Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Returnable Titles List */}
          <div className="space-y-4">
            {filteredMovements.length === 0 ? (
              <div className="text-center py-8">
                <RotateCcw className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No returnable titles found</h3>
                <p className="mt-2 text-muted-foreground">
                  {searchTerm || filterStatus !== "all"
                    ? "No titles match your search criteria."
                    : "All titles are currently in custody."
                  }
                </p>
              </div>
            ) : (
              filteredMovements.map((movement) => (
                <Card key={movement.id} className="relative">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getUrgencyIndicator(movement)}
                            <div>
                              <h4 className="font-semibold">{movement.property.titleNumber}</h4>
                              <p className="text-sm text-muted-foreground">
                                {movement.property.registeredOwner}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(movement.movementStatus)}
                            <Badge variant="outline" className={
                              isOverdue(movement.dateReleased) 
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }>
                              {getDaysOut(movement.dateReleased)} days out
                            </Badge>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Released</span>
                            </div>
                            <p className="text-sm font-semibold">
                              {movement.dateReleased 
                                ? format(new Date(movement.dateReleased), 'MMM dd, yyyy')
                                : "—"
                              }
                            </p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>Released By</span>
                            </div>
                            <p className="text-sm font-semibold">{movement.releasedBy || "—"}</p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                              <Building className="h-4 w-4" />
                              <span>Current Holder</span>
                            </div>
                            <p className="text-sm font-semibold">{movement.receivedByName || "—"}</p>
                          </div>

                          {movement.receivedByTransmittal && (
                            <div className="space-y-1 col-span-full">
                              <div className="text-sm font-medium text-muted-foreground">Transmittal Number</div>
                              <p className="text-sm font-mono bg-muted/50 p-2 rounded">
                                {movement.receivedByTransmittal}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* System Info */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <div>
                            Initiated by {movement.movedBy.firstName} {movement.movedBy.lastName}
                          </div>
                          <div>
                            {format(new Date(movement.createdAt), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleProcessReturn(movement)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Process Return
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {filteredMovements.length > 0 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {filteredMovements.length} of {movements.length} returnable titles
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Dialog */}
      {selectedMovement && (
        <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
          <DialogContent className="!w-[700px] !max-w-[700px] !min-w-[700px]" style={{ width: '700px', maxWidth: '700px', minWidth: '700px' }}>
            <DialogHeader>
              <DialogTitle>Process Title Return</DialogTitle>
            </DialogHeader>
            <TitleReturnForm 
              movement={{
                id: selectedMovement.id,
                propertyId: selectedMovement.propertyId,
                property: selectedMovement.property,
                movementStatus: selectedMovement.movementStatus,
                dateReleased: selectedMovement.dateReleased,
                releasedBy: selectedMovement.releasedBy,
                receivedByName: selectedMovement.receivedByName,
                receivedByTransmittal: selectedMovement.receivedByTransmittal,
              }}
              onSuccess={handleReturnSuccess}
              onCancel={() => setIsReturnDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
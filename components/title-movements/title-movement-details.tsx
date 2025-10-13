import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TitleMovementWithDetails } from "@/lib/actions/title-movement-actions"
import { MovementStatus } from "@prisma/client"
import { 
  FileText, 
  Activity,
  Building2,
  MapPin
} from "lucide-react"

interface TitleMovementDetailsProps {
  titleMovement: TitleMovementWithDetails
}

function getStatusColor(status: MovementStatus) {
  switch (status) {
    case MovementStatus.RELEASED:
      return "bg-blue-600 text-white"
    case MovementStatus.IN_TRANSIT:
      return "bg-yellow-600 text-white"
    case MovementStatus.RECEIVED:
      return "bg-purple-600 text-white"
    case MovementStatus.RETURNED:
      return "bg-green-600 text-white"
    case MovementStatus.LOST:
      return "bg-red-600 text-white"
    case MovementStatus.PENDING_RETURN:
      return "bg-orange-600 text-white"
    default:
      return "bg-gray-600 text-white"
  }
}

export function TitleMovementDetails({ titleMovement }: TitleMovementDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Movement Status Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Title Movement Details</CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={getStatusColor(titleMovement.movementStatus)}>
                {titleMovement.movementStatus.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Created {new Date(titleMovement.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Activity className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
      </Card>

      {/* Key Information Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Title</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{titleMovement.property.titleNumber}</div>
            <p className="text-xs text-muted-foreground">
              {titleMovement.property.registeredOwner}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Details</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parseFloat(titleMovement.property.lotArea).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              sq.m • {titleMovement.property.classification.replace('_', ' ')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{titleMovement.property.city}</div>
            <p className="text-xs text-muted-foreground">
              {titleMovement.property.barangay}, {titleMovement.property.province}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Movement Information */}
      <Card>
        <CardHeader>
          <CardTitle>Movement Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium">Purpose of Release</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {titleMovement.purposeOfRelease || 'No purpose specified'}
                </div>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Released By</div>
                <div className="text-sm">{titleMovement.releasedBy || 'Not specified'}</div>
              </div>
              
              {titleMovement.approvedBy && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Approved By</div>
                  <div className="text-sm">{titleMovement.approvedBy}</div>
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Initiated By</div>
                <div className="text-sm">{titleMovement.movedBy.firstName} {titleMovement.movedBy.lastName}</div>
              </div>
              
              {titleMovement.receivedByTransmittal && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Transmittal Number</div>
                  <div className="text-sm">{titleMovement.receivedByTransmittal}</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Information */}
      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Title Number</div>
              <div className="font-medium">{titleMovement.property.titleNumber}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Lot Number</div>
              <div className="font-medium">{titleMovement.property.lotNumber}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Lot Area</div>
              <div className="font-medium">{parseFloat(titleMovement.property.lotArea).toLocaleString()} sq.m</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Classification</div>
              <div className="font-medium">{titleMovement.property.classification.replace('_', ' ')}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
              <Badge variant="outline">{titleMovement.property.status.replace('_', ' ')}</Badge>
            </div>
            
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Registered Owner</div>
              <div className="font-medium">{titleMovement.property.registeredOwner}</div>
            </div>
            
            {titleMovement.property.custodyOfTitle && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Current Custody</div>
                <div className="font-medium">{titleMovement.property.custodyOfTitle}</div>
              </div>
            )}
          </div>
          
          {/* Location Details */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-3">Location Details</h4>
            <div className="grid gap-4 md:grid-cols-2">
              {titleMovement.property.location && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Specific Location</div>
                  <div className="text-sm">{titleMovement.property.location}</div>
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Barangay</div>
                <div className="text-sm">{titleMovement.property.barangay}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">City</div>
                <div className="text-sm">{titleMovement.property.city}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Province</div>
                <div className="text-sm">{titleMovement.property.province}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Movement Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {titleMovement.dateReleased && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium">Title Released</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(titleMovement.dateReleased).toLocaleString()}
                    {titleMovement.releasedBy && ` • Released by ${titleMovement.releasedBy}`}
                  </div>
                </div>
              </div>
            )}
            
            {titleMovement.receivedByTransmittal && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium">In Transit</div>
                  <div className="text-sm text-muted-foreground">
                    Transmittal: {titleMovement.receivedByTransmittal}
                    {titleMovement.receivedByName && ` • To be received by ${titleMovement.receivedByName}`}
                  </div>
                </div>
              </div>
            )}
            
            {titleMovement.turnedOverDate && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium">Title Received</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(titleMovement.turnedOverDate).toLocaleString()}
                    {titleMovement.turnedOverBy && ` • Turned over by ${titleMovement.turnedOverBy}`}
                    {titleMovement.receivedByPerson && ` • Received by ${titleMovement.receivedByPerson}`}
                  </div>
                </div>
              </div>
            )}
            
            {titleMovement.dateReturned && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium">Title Returned</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(titleMovement.dateReturned).toLocaleString()}
                    {titleMovement.returnedBy && ` • Returned by ${titleMovement.returnedBy}`}
                    {titleMovement.receivedByOnReturn && ` • Received by ${titleMovement.receivedByOnReturn}`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
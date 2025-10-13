import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PropertyWithFullDetails } from "@/lib/actions/property-actions"
import { PropertyClassification, PropertyStatus } from "@prisma/client"
import { Building, MapPin, User, FileText, Calendar, Hash, Ruler, Calculator, Activity } from "lucide-react"

interface PropertyOverviewProps {
  property: PropertyWithFullDetails
}

function getClassificationColor(classification: PropertyClassification) {
  switch (classification) {
    case PropertyClassification.RESIDENTIAL:
      return "bg-blue-100 text-blue-800"
    case PropertyClassification.COMMERCIAL:
      return "bg-green-100 text-green-800"
    case PropertyClassification.INDUSTRIAL:
      return "bg-purple-100 text-purple-800"
    case PropertyClassification.AGRICULTURAL:
      return "bg-yellow-100 text-yellow-800"
    case PropertyClassification.MIXED_USE:
      return "bg-orange-100 text-orange-800"
    case PropertyClassification.INSTITUTIONAL:
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function getStatusColor(status: PropertyStatus) {
  switch (status) {
    case PropertyStatus.ACTIVE:
      return "bg-green-100 text-green-800"
    case PropertyStatus.COLLATERAL:
      return "bg-yellow-100 text-yellow-800"
    case PropertyStatus.SOLD:
      return "bg-blue-100 text-blue-800"
    case PropertyStatus.UNDER_DEVELOPMENT:
      return "bg-purple-100 text-purple-800"
    case PropertyStatus.FORECLOSED:
      return "bg-red-100 text-red-800"
    case PropertyStatus.DISPOSED:
      return "bg-gray-100 text-gray-800"
    case PropertyStatus.PENDING_TRANSFER:
      return "bg-orange-100 text-orange-800"
    case PropertyStatus.INACTIVE:
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function PropertyOverview({ property }: PropertyOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Real Property Taxes</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{property._count.realPropertyTaxes}</div>
            <p className="text-xs text-muted-foreground">Tax records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Title Movements</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{property._count.titleMovements}</div>
            <p className="text-xs text-muted-foreground">Movement records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{property._count.documents}</div>
            <p className="text-xs text-muted-foreground">Attached files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approvals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{property._count.approvalWorkflows}</div>
            <p className="text-xs text-muted-foreground">Workflow records</p>
          </CardContent>
        </Card>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Basic Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span>Title Number</span>
              </div>
              <p className="font-semibold">{property.titleNumber}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Lot Number</span>
              </div>
              <p className="font-semibold">{property.lotNumber}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                <Ruler className="h-4 w-4" />
                <span>Lot Area</span>
              </div>
              <p className="font-semibold">{property.lotArea.toString()} sqm</p>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Classification</div>
              <Badge className={getClassificationColor(property.classification)}>
                {property.classification.replace('_', ' ')}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <Badge className={getStatusColor(property.status)}>
                {property.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {property.description && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Description</div>
              <p className="text-sm">{property.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Location Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {property.location && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Specific Location</div>
              <p className="text-sm">{property.location}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Barangay</div>
              <p className="font-semibold">{property.barangay}</p>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">City</div>
              <p className="font-semibold">{property.city}</p>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Province</div>
              <p className="font-semibold">{property.province}</p>
            </div>

            {property.zipCode && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Zip Code</div>
                <p className="font-semibold">{property.zipCode}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Owner Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Owner Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Registered Owner</div>
              <p className="font-semibold">{property.registeredOwner}</p>
            </div>

            {property.bank && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Bank</div>
                <p className="font-semibold">{property.bank}</p>
              </div>
            )}
          </div>

          {property.custodyOfTitle && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Custody of Title</div>
              <p className="text-sm">{property.custodyOfTitle}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Information */}
      {(property.encumbrance || property.mortgageDetails || property.borrowerMortgagor) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Financial Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {property.encumbrance && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Encumbrance</div>
                <p className="text-sm">{property.encumbrance}</p>
              </div>
            )}

            {property.mortgageDetails && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Mortgage Details</div>
                <p className="text-sm">{property.mortgageDetails}</p>
              </div>
            )}

            {property.borrowerMortgagor && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Borrower/Mortgagor</div>
                <p className="font-semibold">{property.borrowerMortgagor}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      {(property.taxDeclaration || property.remarks) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {property.taxDeclaration && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Tax Declaration</div>
                <p className="font-semibold">{property.taxDeclaration}</p>
              </div>
            )}

            {property.remarks && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Remarks</div>
                <p className="text-sm">{property.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>System Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Created By</div>
              <p className="font-semibold">
                {property.createdBy.firstName} {property.createdBy.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(property.createdAt).toLocaleDateString()}
              </p>
            </div>

            {property.updatedBy && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Last Updated By</div>
                <p className="font-semibold">
                  {property.updatedBy.firstName} {property.updatedBy.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(property.updatedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
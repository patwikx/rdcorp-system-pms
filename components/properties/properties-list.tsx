import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getProperties, type PropertyWithDetails } from "@/lib/actions/property-actions"
import { PropertyClassification, PropertyStatus } from "@prisma/client"
import { 
  Eye, 
  Edit, 
  MapPin, 
  Building, 
  User, 
  Calendar,
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

interface PropertiesListProps {
  searchParams: Promise<{
    search?: string
    classification?: string
    status?: string
    page?: string
  }>
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

export async function PropertiesList({ searchParams }: PropertiesListProps) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || "1")
  const search = resolvedSearchParams.search
  const classification = resolvedSearchParams.classification as PropertyClassification | undefined
  const status = resolvedSearchParams.status as PropertyStatus | undefined

  const { properties, totalCount, totalPages }: {
    properties: PropertyWithDetails[]
    totalCount: number
    totalPages: number
  } = await getProperties({
    search,
    classification,
    status,
    page,
    limit: 12,
  })

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No properties found</h3>
          <p className="text-muted-foreground text-center mb-4">
            {search || classification || status
              ? "No properties match your current filters."
              : "Get started by creating your first property."}
          </p>
          <Button asChild>
            <Link href="/properties/create">Create Property</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {properties.length} of {totalCount} properties
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Card key={property.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{property.titleNumber}</h3>
                    <p className="text-sm text-muted-foreground">{property.lotNumber}</p>
                  </div>
                  <div className="flex space-x-1">
                    <Badge className={getClassificationColor(property.classification)}>
                      <div className="flex items-center space-x-1">
                        {(() => {
                          const Icon = classificationIcons[property.classification]
                          return <Icon className="h-3 w-3" />
                        })()}
                        <span>{property.classification.replace('_', ' ')}</span>
                      </div>
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{property.registeredOwner}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">
                      {property.barangay}, {property.city}, {property.province}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{Number(property.lotArea).toLocaleString()} sqm</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Created {new Date(property.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge className={getStatusColor(property.status)}>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-current" />
                      <span>{property.status.replace('_', ' ')}</span>
                    </div>
                  </Badge>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/properties/${property.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/properties/${property.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t text-xs text-muted-foreground">
                  <div className="text-center">
                    <div className="font-medium">{property._count.realPropertyTaxes}</div>
                    <div>Taxes</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{property._count.titleMovements}</div>
                    <div>Movements</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{property._count.documents}</div>
                    <div>Documents</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link
                href={{
                  pathname: "/properties",
                  query: { 
                    ...(search && { search }),
                    ...(classification && { classification }),
                    ...(status && { status }),
                    page: pageNum.toString() 
                  },
                }}
              >
                {pageNum}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
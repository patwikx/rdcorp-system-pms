import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getTitleMovements } from "@/lib/actions/title-movement-actions"
import { MovementStatus } from "@prisma/client"
import { Eye, Edit, Calendar, User, FileText, ArrowRight } from "lucide-react"

interface TitleMovementsListProps {
  searchParams: Promise<{
    propertyId?: string
    status?: string
    page?: string
  }>
}

function getStatusColor(status: MovementStatus) {
  switch (status) {
    case MovementStatus.RELEASED:
      return "bg-blue-100 text-blue-800"
    case MovementStatus.IN_TRANSIT:
      return "bg-yellow-100 text-yellow-800"
    case MovementStatus.RECEIVED:
      return "bg-purple-100 text-purple-800"
    case MovementStatus.RETURNED:
      return "bg-green-100 text-green-800"
    case MovementStatus.LOST:
      return "bg-red-100 text-red-800"
    case MovementStatus.PENDING_RETURN:
      return "bg-orange-100 text-orange-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function getStatusIcon(status: MovementStatus) {
  switch (status) {
    case MovementStatus.RELEASED:
      return "📤"
    case MovementStatus.IN_TRANSIT:
      return "🚚"
    case MovementStatus.RECEIVED:
      return "📥"
    case MovementStatus.RETURNED:
      return "✅"
    case MovementStatus.LOST:
      return "❌"
    case MovementStatus.PENDING_RETURN:
      return "⏳"
    default:
      return "📄"
  }
}

export async function TitleMovementsList({ searchParams }: TitleMovementsListProps) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || "1")
  const propertyId = resolvedSearchParams.propertyId
  const status = resolvedSearchParams.status as MovementStatus | undefined

  const { titleMovements, totalCount, totalPages } = await getTitleMovements({
    propertyId,
    status,
    page,
    limit: 12,
  })

  if (titleMovements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No title movements found</h3>
          <p className="text-muted-foreground text-center mb-4">
            {propertyId || status
              ? "No title movements match your current filters."
              : "Get started by requesting your first title movement."}
          </p>
          <Button asChild>
            <Link href="/title-movements/create">Request Movement</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {titleMovements.length} of {totalCount} title movements
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {titleMovements.map((movement) => (
          <Card key={movement.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{movement.property.titleNumber}</h3>
                    <p className="text-sm text-muted-foreground">{movement.property.registeredOwner}</p>
                  </div>
                  <Badge className={getStatusColor(movement.movementStatus)}>
                    <span className="mr-1">{getStatusIcon(movement.movementStatus)}</span>
                    {movement.movementStatus.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">Released by: {movement.releasedBy}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {movement.dateReleased 
                        ? new Date(movement.dateReleased).toLocaleDateString()
                        : "Not yet released"}
                    </span>
                  </div>
                  {movement.purposeOfRelease && (
                    <div className="flex items-start space-x-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="truncate">{movement.purposeOfRelease}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Moved by: {movement.movedBy.firstName} {movement.movedBy.lastName}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/title-movements/${movement.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {movement.movementStatus !== MovementStatus.RETURNED && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/title-movements/${movement.id}/update`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Movement Timeline Preview */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        movement.dateReleased ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <span>Released</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        movement.movementStatus === MovementStatus.IN_TRANSIT ? 'bg-yellow-500' : 
                        movement.turnedOverDate ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <span>In Transit</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        movement.turnedOverDate ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <span>Received</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        movement.dateReturned ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <span>Returned</span>
                    </div>
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
                  pathname: "/title-movements",
                  query: { 
                    ...(propertyId && { propertyId }),
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
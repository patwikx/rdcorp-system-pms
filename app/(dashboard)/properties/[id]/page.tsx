import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getPropertyWithFullDetails } from "@/lib/actions/property-actions"
import { PropertyDetails } from "@/components/properties/property-details"

interface PropertyPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const resolvedParams = await params
  const propertyData = await getPropertyWithFullDetails(resolvedParams.id)

  if (!propertyData) {
    notFound()
  }

  // Property data is already converted in the action
  const property = propertyData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {property.titleNumber}
              </h1>
              {property.approvalWorkflows.some(w => w.status === 'PENDING') && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Changes
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {property.registeredOwner} • {property.city}, {property.province}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/properties/${property.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Request Changes
          </Link>
        </Button>
      </div>

      <PropertyDetails property={property} />
    </div>
  )
}
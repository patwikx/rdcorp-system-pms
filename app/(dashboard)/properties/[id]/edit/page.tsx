import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getProperty } from "@/lib/actions/property-actions"
import { EditPropertyForm } from "@/components/properties/edit-property-form"
import { Save, X } from "lucide-react"

interface EditPropertyPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  const resolvedParams = await params
  const property = await getProperty(resolvedParams.id)

  if (!property) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Property</h1>
          <p className="text-muted-foreground">
            Update property information for {property.titleNumber}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href={`/properties/${property.id}`}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Link>
          </Button>
          <Button type="submit" form="edit-property-form">
            <Save className="h-4 w-4 mr-2" />
            Update Property
          </Button>
        </div>
      </div>

      <EditPropertyForm property={property} />
    </div>
  )
}
import { notFound } from "next/navigation"
import { getProperty } from "@/lib/actions/property-actions"
import { EditPropertyForm } from "@/components/properties/edit-property-form"

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
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Property</h1>
          <p className="text-muted-foreground">
            Update property information for {property.titleNumber}
          </p>
        </div>
      </div>

      <EditPropertyForm property={property} />
    </div>
  )
}
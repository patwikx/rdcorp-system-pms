import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PropertiesList } from "@/components/properties/properties-list"
import { PropertiesFilters } from "@/components/properties/properties-filters"
import { ExportPropertiesButton } from "@/components/properties/export-properties-button"

interface PropertiesPageProps {
  searchParams: Promise<{
    search?: string
    classification?: string
    status?: string
    page?: string
  }>
}

export default function PropertiesPage({ searchParams }: PropertiesPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">
            Manage property titles and their information
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <ExportPropertiesButton />
          <Button asChild>
            <Link href="/properties/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Link>
          </Button>
        </div>
      </div>

      <PropertiesFilters />

      <Suspense fallback={<div>Loading properties...</div>}>
        <PropertiesList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
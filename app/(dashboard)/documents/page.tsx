import { Suspense } from "react"
import { DocumentsStatsWrapper } from "@/components/documents/documents-stats-wrapper"
import { DocumentsStatsSkeleton } from "@/components/documents/documents-stats-skeleton"
import { DocumentsFilters } from "@/components/documents/documents-filters"
import { DocumentsListWrapper } from "@/components/documents/documents-list-wrapper"

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic'

interface DocumentsPageProps {
  searchParams: Promise<{
    search?: string
    documentType?: string
    page?: string
    filename?: string
    id?: string
    property?: string
  }>
}

export default function DocumentsPage({ searchParams }: DocumentsPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Manage and view property documents and files
        </p>
      </div>

      <Suspense fallback={<DocumentsStatsSkeleton />}>
        <DocumentsStatsWrapper />
      </Suspense>

      <DocumentsFilters />

      <Suspense fallback={<div>Loading documents...</div>}>
        <DocumentsListWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
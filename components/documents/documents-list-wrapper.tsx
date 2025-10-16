import { DocumentsList } from "./documents-list"

interface DocumentsListWrapperProps {
  searchParams: Promise<{
    search?: string
    documentType?: string
    page?: string
    filename?: string
    id?: string
    property?: string
  }>
}

export function DocumentsListWrapper({ searchParams }: DocumentsListWrapperProps) {
  return <DocumentsList searchParams={searchParams} />
}
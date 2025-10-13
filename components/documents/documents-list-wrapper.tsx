import { DocumentsList } from "./documents-list"

interface DocumentsListWrapperProps {
  searchParams: Promise<{
    search?: string
    documentType?: string
    page?: string
  }>
}

export function DocumentsListWrapper({ searchParams }: DocumentsListWrapperProps) {
  return <DocumentsList searchParams={searchParams} />
}
import { DocumentsStats } from "./documents-stats"
import { getDocumentStats } from "@/lib/actions/document-actions"

export async function DocumentsStatsWrapper() {
  const { stats, totalDocuments, activeDocuments } = await getDocumentStats()
  
  return <DocumentsStats stats={stats} totalDocuments={totalDocuments} activeDocuments={activeDocuments} />
}
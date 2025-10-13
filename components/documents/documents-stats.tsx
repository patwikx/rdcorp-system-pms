"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocumentType } from "@prisma/client"
import { 
  FileText, 
  Receipt, 
  MapPin, 
  FileImage,
  FileCheck,
  Handshake,
  Building,
  TrendingUp,
  Folder
} from "lucide-react"

interface DocumentStats {
  documentType: DocumentType
  count: number
}

interface DocumentsStatsProps {
  stats: DocumentStats[]
  totalDocuments: number
  activeDocuments: number
}

// Document type configuration with icons and colors - matching other pages aesthetics
const documentTypeConfig = {
  [DocumentType.TITLE_DEED]: {
    icon: FileText,
    label: "Title Deeds",
    color: "text-blue-600",
    description: "Property title documents"
  },
  [DocumentType.TAX_DECLARATION]: {
    icon: Receipt,
    label: "Tax Declarations",
    color: "text-green-600",
    description: "Tax declaration forms"
  },
  [DocumentType.TAX_RECEIPT]: {
    icon: Receipt,
    label: "Tax Receipts",
    color: "text-emerald-600",
    description: "Payment receipts"
  },
  [DocumentType.SURVEY_PLAN]: {
    icon: MapPin,
    label: "Survey Plans",
    color: "text-purple-600",
    description: "Property surveys"
  },
  [DocumentType.MORTGAGE_CONTRACT]: {
    icon: FileCheck,
    label: "Mortgage Contracts",
    color: "text-red-600",
    description: "Mortgage agreements"
  },
  [DocumentType.SALE_AGREEMENT]: {
    icon: Handshake,
    label: "Sale Agreements",
    color: "text-orange-600",
    description: "Property sale contracts"
  },
  [DocumentType.LEASE_AGREEMENT]: {
    icon: Building,
    label: "Lease Agreements",
    color: "text-indigo-600",
    description: "Rental contracts"
  },
  [DocumentType.APPRAISAL_REPORT]: {
    icon: TrendingUp,
    label: "Appraisal Reports",
    color: "text-cyan-600",
    description: "Property valuations"
  },
  [DocumentType.PHOTO]: {
    icon: FileImage,
    label: "Photos",
    color: "text-pink-600",
    description: "Property images"
  },
  [DocumentType.OTHER]: {
    icon: Folder,
    label: "Other Documents",
    color: "text-gray-600",
    description: "Miscellaneous files"
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DocumentsStats({ stats, totalDocuments, activeDocuments }: DocumentsStatsProps) {
  // Create a map for quick lookup
  const statsMap = new Map(stats.map(stat => [stat.documentType, stat.count]))

  // Get the top 6 document types by count for display
  const topDocumentTypes = Object.entries(documentTypeConfig)
    .map(([type, config]) => ({
      type: type as DocumentType,
      config,
      count: statsMap.get(type as DocumentType) || 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {topDocumentTypes.map(({ type, config, count }) => {
        const Icon = config.icon

        return (
          <Card key={type}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${config.color}`}>
                {count.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {config.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
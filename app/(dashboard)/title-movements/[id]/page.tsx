import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTitleMovement } from "@/lib/actions/title-movement-actions"
import { TitleMovementDetails } from "@/components/title-movements/title-movement-details"

interface TitleMovementPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TitleMovementPage({ params }: TitleMovementPageProps) {
  const resolvedParams = await params
  const titleMovement = await getTitleMovement(resolvedParams.id)

  if (!titleMovement) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Title Movement Details
            </h1>
            <p className="text-muted-foreground">
              {titleMovement.property.titleNumber} • {titleMovement.property.registeredOwner}
            </p>
          </div>
        </div>
      </div>

      <TitleMovementDetails titleMovement={titleMovement} />
    </div>
  )
}
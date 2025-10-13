import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApprovalWorkflowById } from "@/lib/actions/approval-actions"
import { ApprovalDetails } from "@/components/approvals/approval-details"

interface ApprovalDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ApprovalDetailPage({ params }: ApprovalDetailPageProps) {
  const resolvedParams = await params
  const approval = await getApprovalWorkflowById(resolvedParams.id)

  if (!approval) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Approval Request
            </h1>
            <p className="text-muted-foreground">
              {approval.property.titleNumber} • {approval.property.registeredOwner}
            </p>
          </div>
        </div>
      </div>

      <ApprovalDetails approval={approval} />
    </div>
  )
}
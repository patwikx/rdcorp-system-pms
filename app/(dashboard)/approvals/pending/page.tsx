import { Suspense } from "react"
import { PendingApprovalsList } from "@/components/approvals/pending-approvals-list"

export default function PendingApprovalsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pending Approvals</h2>
          <p className="text-muted-foreground">
            Review and approve pending title movement requests
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <PendingApprovalsList pendingApprovals={[]} />
      </Suspense>
    </div>
  )
}
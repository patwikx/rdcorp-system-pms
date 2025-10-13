import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileX, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileX className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Request Not Found</h2>
          <p className="text-muted-foreground text-center mb-6">
            The approval request you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Button asChild>
            <Link href="/approvals/my-requests">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Requests
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
import { UserDetails } from "@/components/users/user-details"
import { getUser } from "@/lib/actions/user-actions"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface UserPageProps {
  params: Promise<{ id: string }>
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params
  const user = await getUser(id)

  if (!user) {
    notFound()
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
        </div>
        <Button asChild>
          <Link href={`/users/${user.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit User
          </Link>
        </Button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">
          {user.firstName} {user.lastName}
        </h2>
        <p className="text-muted-foreground">
          User details and information
        </p>
      </div>

      <UserDetails user={user} />
    </div>
  )
}
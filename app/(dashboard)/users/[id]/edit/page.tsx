import { EditUserForm } from "@/components/users/edit-user-form"
import { getUser } from "@/lib/actions/user-actions"
import { notFound } from "next/navigation"

interface EditUserPageProps {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params
  const user = await getUser(id)

  if (!user) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Edit User</h2>
        <p className="text-muted-foreground">
          Modify user details and role assignment
        </p>
      </div>

      <EditUserForm user={user} />
    </div>
  )
}
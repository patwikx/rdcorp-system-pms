import { EditRoleForm } from "@/components/users/edit-role-form"
import { getRole } from "@/lib/actions/role-actions"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface EditRolePageProps {
  params: Promise<{ id: string }>
}

export default async function EditRolePage({ params }: EditRolePageProps) {
  const { id } = await params
  const role = await getRole(id)

  if (!role) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Edit Role</h2>
        <p className="text-muted-foreground">
          Modify role details and permissions
        </p>
      </div>

      <EditRoleForm role={role} />
    </div>
  )
}
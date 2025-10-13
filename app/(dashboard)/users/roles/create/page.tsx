import { CreateRoleForm } from "@/components/users/create-role-form"


export default function CreateRolePage() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Create Role</h2>
        <p className="text-muted-foreground">
          Create a new role and assign permissions
        </p>
      </div>

      <CreateRoleForm />
    </div>
  )
}
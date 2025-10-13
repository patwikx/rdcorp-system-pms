import { RolesList } from "./roles-list"

interface RolesListWrapperProps {
  searchParams: Promise<{
    search?: string
    status?: string
    type?: string
    page?: string
  }>
}

export function RolesListWrapper({ searchParams }: RolesListWrapperProps) {
  return <RolesList searchParams={searchParams} />
}
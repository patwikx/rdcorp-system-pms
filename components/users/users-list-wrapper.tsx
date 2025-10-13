import { UsersList } from "./users-list"

interface UsersListWrapperProps {
  searchParams: Promise<{
    search?: string
    status?: string
    role?: string
    department?: string
    page?: string
  }>
}

export function UsersListWrapper({ searchParams }: UsersListWrapperProps) {
  return <UsersList searchParams={searchParams} />
}
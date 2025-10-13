"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getUsersWithApprovalPermission, type UserOption } from "@/lib/actions/user-actions"

interface UserSelectorProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function UserSelector({
  value,
  onValueChange,
  placeholder = "Select user...",
  disabled = false,
}: UserSelectorProps) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUsers() {
      try {
        setIsLoading(true)
        const fetchedUsers = await getUsersWithApprovalPermission()
        setUsers(fetchedUsers)
      } catch (error) {
        console.error('Error loading users:', error)
        // Show a toast or handle error gracefully
        setUsers([])
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [])

  const selectedUser = users.find((user) => user.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{selectedUser.firstName} {selectedUser.lastName}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {isLoading ? "Loading users..." : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading..." : "No users found."}
            </CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.firstName} ${user.lastName} ${user.email}`}
                  onSelect={() => {
                    onValueChange(user.id === value ? "" : user.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
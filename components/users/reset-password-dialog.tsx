"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { resetUserPassword } from "@/lib/actions/user-actions"
import { Key, Shuffle } from "lucide-react"
import { toast } from "sonner"

interface ResetPasswordDialogProps {
  userId: string
  userName: string
}

export function ResetPasswordDialog({ userId, userName }: ResetPasswordDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")

  function generateSecurePassword(): string {
    const length = 12
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*'
    
    // Ensure at least one character from each category
    let password = ''
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]
    
    // Fill the rest with random characters from all categories
    const allChars = lowercase + uppercase + numbers + symbols
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }
    
    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  function handleGeneratePassword() {
    const generatedPassword = generateSecurePassword()
    setNewPassword(generatedPassword)
    toast.success("Secure password generated")
  }

  async function handleResetPassword() {
    if (!newPassword.trim()) {
      toast.error("Please enter a new password")
      return
    }

    setIsResettingPassword(true)
    try {
      const result = await resetUserPassword(userId, newPassword)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Password reset successfully")
        setNewPassword("")
        setIsOpen(false)
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      toast.error("Failed to reset password")
    } finally {
      setIsResettingPassword(false)
    }
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (!open) {
      setNewPassword("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Key className="h-4 w-4 mr-2" />
          Reset Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Generate a new password for {userName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">New Password</label>
            <div className="flex space-x-2 mt-1">
              <Input
                type="password"
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isResettingPassword}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGeneratePassword}
                disabled={isResettingPassword}
                className="px-3"
                title="Generate secure password"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
            {newPassword && (
              <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                <span className="text-muted-foreground">Generated password: </span>
                <span className="font-mono font-medium">{newPassword}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 pt-4">
            <Button
              onClick={handleResetPassword}
              disabled={isResettingPassword || !newPassword.trim()}
              className="flex-1"
            >
              <Key className="h-4 w-4 mr-2" />
              {isResettingPassword ? "Resetting..." : "Reset Password"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isResettingPassword}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
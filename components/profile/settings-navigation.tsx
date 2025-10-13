'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { User, Settings } from "lucide-react"

const settingsNavItems = [
  {
    title: "Profile",
    href: "/settings/profile",
    icon: User,
    description: "Manage your personal information"
  },
  {
    title: "Preferences",
    href: "/settings/preferences", 
    icon: Settings,
    description: "Customize your application settings"
  }
]

export function SettingsNavigation() {
  const pathname = usePathname()

  return (
    <Card>
      <CardContent className="p-6">
        <nav className="flex space-x-8">
          {settingsNavItems.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </CardContent>
    </Card>
  )
}
'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Building2, 
  TrendingUp, 
  Receipt, 
  CheckSquare, 
  Search, 
  FolderOpen,
  Plus,
  Zap
} from 'lucide-react'
import type { QuickAction } from '@/lib/actions/dashboard-actions'

interface QuickActionsProps {
  actions: QuickAction[]
}

const iconMap = {
  Building2,
  TrendingUp,
  Receipt,
  CheckSquare,
  Search,
  FolderOpen,
  Plus,
  Zap
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => {
          const Icon = iconMap[action.icon as keyof typeof iconMap] || Building2
          
          return (
            <Button
              key={index}
              asChild
              variant="outline"
              className="w-full justify-start h-auto p-4 text-left"
            >
              <Link href={action.href}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            </Button>
          )
        })}
        
        {actions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No quick actions available based on your permissions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
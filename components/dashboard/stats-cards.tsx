'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Receipt, TrendingUp, CheckSquare, ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import type { DashboardStats } from '@/lib/actions/dashboard-actions'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Properties',
      value: stats.properties.total.toLocaleString(),
      description: `${stats.properties.active} active, ${stats.properties.collateral} collateral`,
      icon: Building2,
      trend: {
        value: stats.properties.recentlyAdded.length,
        label: 'added this month',
        type: 'positive' as const
      }
    },
    {
      title: 'Tax Collection',
      value: `₱${stats.taxes.totalPaid.toLocaleString()}`,
      description: `${stats.taxes.collectionRate}% collection rate`,
      icon: Receipt,
      trend: {
        value: stats.taxes.overdue,
        label: 'overdue payments',
        type: stats.taxes.overdue > 0 ? 'negative' as const : 'neutral' as const
      }
    },
    {
      title: 'Title Movements',
      value: stats.titleMovements.currentlyOut.toLocaleString(),
      description: `${stats.titleMovements.totalReturned} returned`,
      icon: TrendingUp,
      trend: {
        value: stats.titleMovements.overdue,
        label: 'overdue returns',
        type: stats.titleMovements.overdue > 0 ? 'negative' as const : 'positive' as const
      }
    },
    {
      title: 'Pending Approvals',
      value: stats.approvals.pending.toLocaleString(),
      description: `${stats.approvals.myRequests} my requests`,
      icon: CheckSquare,
      trend: {
        value: stats.approvals.approved,
        label: 'approved recently',
        type: 'positive' as const
      }
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
              <div className="flex items-center mt-2">
                {card.trend.type === 'positive' && (
                  <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
                )}
                {card.trend.type === 'negative' && (
                  <ArrowDownIcon className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={`text-xs ${
                  card.trend.type === 'positive' ? 'text-green-600' :
                  card.trend.type === 'negative' ? 'text-red-600' :
                  'text-muted-foreground'
                }`}>
                  {card.trend.value} {card.trend.label}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
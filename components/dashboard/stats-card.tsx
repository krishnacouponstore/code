import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: string
  subtitle?: string
  actionLabel?: string
  actionHref?: string
}

export function StatsCard({ icon: Icon, label, value, subtitle, actionLabel, actionHref }: StatsCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-secondary">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {actionLabel}
            </Link>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

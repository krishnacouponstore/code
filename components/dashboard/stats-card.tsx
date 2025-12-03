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
    <Card
      className="rounded-2xl border border-border/50 transition-all duration-300 ease-out hover:-translate-y-1
      bg-gradient-to-br from-[hsl(160,35%,97%)] to-[hsl(160,30%,94%)] 
      hover:border-primary/40 hover:shadow-[0_8px_32px_rgba(16,185,129,0.12),0_4px_16px_rgba(16,185,129,0.08)]
      dark:bg-gradient-to-b dark:from-[hsl(200,15%,13%)] dark:to-[hsl(200,15%,10%)] 
      dark:border-[hsl(200,15%,20%)] dark:hover:border-primary/40 
      dark:hover:shadow-[0_8px_32px_hsl(165,96%,71%,0.1),0_0_0_1px_hsl(165,96%,71%,0.1)]"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div
            className="p-3 rounded-xl transition-transform duration-300 hover:scale-110
            bg-gradient-to-br from-primary/15 to-primary/5 
            dark:from-primary/20 dark:to-primary/5"
          >
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
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

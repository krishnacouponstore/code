"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, ShoppingCart, CreditCard, Loader2 } from "lucide-react"
import Link from "next/link"
import { useUserProfile } from "@/hooks/use-user-profile"

export function AccountStats() {
  const { data: profile, isLoading } = useUserProfile()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!profile) return null

  const stats = [
    {
      icon: Wallet,
      label: "Wallet Balance",
      value: formatCurrency(profile.wallet_balance),
      link: { href: "/add-balance", text: "Add Balance" },
      iconColor: "text-primary",
    },
    {
      icon: ShoppingCart,
      label: "Total Purchases",
      value: `${profile.total_purchased} coupons`,
      iconColor: "text-blue-400",
    },
    {
      icon: CreditCard,
      label: "Total Spent",
      value: formatCurrency(profile.total_spent),
      iconColor: "text-green-400",
    },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Account Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3">
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              <span className="text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">{stat.value}</p>
              {stat.link && (
                <Link href={stat.link.href} className="text-xs text-primary hover:underline">
                  {stat.link.text}
                </Link>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

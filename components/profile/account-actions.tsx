"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { History, ShoppingBag, Plus, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function AccountActions() {
  const { logout } = useAuth()
  const router = useRouter()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const quickLinks = [
    { icon: History, label: "Purchase History", href: "/history" },
    { icon: ShoppingBag, label: "Browse Coupons", href: "/store" },
    { icon: Plus, label: "Add Balance", href: "/add-balance" },
  ]

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <link.icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground">{link.label}</span>
            </Link>
          ))}

          {/* Danger Zone */}
          <div className="pt-4 mt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(true)}
              className="w-full rounded-full border-destructive text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full border-border text-foreground hover:bg-secondary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

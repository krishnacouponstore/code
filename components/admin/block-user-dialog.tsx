"use client"

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
import { formatCurrency } from "@/lib/utils"
import type { AdminUser } from "@/lib/mock-data"
import { AlertTriangle } from "lucide-react"

interface BlockUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
  onConfirm: () => void
}

export function BlockUserDialog({ open, onOpenChange, user, onConfirm }: BlockUserDialogProps) {
  if (!user) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <AlertDialogTitle className="text-foreground">Block User?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground">
            Block <span className="font-medium text-foreground">{user.full_name}</span>? They won&apos;t be able to
            login or make purchases.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-secondary/50 rounded-lg p-4 my-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email:</span>
            <span className="text-foreground">{user.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Balance:</span>
            <span className="text-foreground">{formatCurrency(user.wallet_balance)} (will be preserved)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Orders:</span>
            <span className="text-foreground">{user.total_orders} (will remain accessible)</span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full border-border">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Block User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

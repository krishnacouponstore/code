"use client"

import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { formatCurrency } from "@/lib/utils"
import type { AdminUser } from "@/hooks/use-admin-users"
import { AlertOctagon, Loader2 } from "lucide-react"

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
  onConfirm: () => Promise<void>
}

export function DeleteUserDialog({ open, onOpenChange, user, onConfirm }: DeleteUserDialogProps) {
  const [understood, setUnderstood] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      setUnderstood(false)
      setConfirmText("")
    }
  }, [open])

  if (!user) return null

  const canDelete = understood && confirmText === "DELETE"

  const handleDelete = async () => {
    if (!canDelete) return
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertOctagon className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-foreground">Delete User Permanently?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-destructive font-medium">
            This action CANNOT be undone!
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 my-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">User:</span>
            <span className="text-foreground">
              {user.full_name} ({user.email})
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Wallet Balance:</span>
            <span className="text-destructive font-medium">{formatCurrency(user.wallet_balance)} (will be lost)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Purchase History:</span>
            <span className="text-destructive font-medium">{user.total_orders} orders (will be deleted)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Purchased Coupons:</span>
            <span className="text-destructive font-medium">{user.total_purchased} codes (data will be removed)</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="understand"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked as boolean)}
            />
            <label htmlFor="understand" className="text-sm text-foreground cursor-pointer">
              I understand this is permanent
            </label>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">
              Type <span className="font-mono text-foreground">DELETE</span> to confirm
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="mt-1.5 bg-secondary border-border text-foreground font-mono"
            />
          </div>
        </div>

        <AlertDialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full border-border"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Permanently"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

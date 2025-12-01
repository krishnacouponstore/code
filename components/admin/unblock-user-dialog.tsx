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
import type { AdminUser } from "@/lib/mock-data"
import { UserCheck } from "lucide-react"

interface UnblockUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
  onConfirm: () => void
}

export function UnblockUserDialog({ open, onOpenChange, user, onConfirm }: UnblockUserDialogProps) {
  if (!user) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-green-500" />
            </div>
            <AlertDialogTitle className="text-foreground">Unblock User?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground">
            <span className="font-medium text-foreground">{user.full_name}</span> will be able to login and make
            purchases again.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full border-border">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="rounded-full bg-green-600 text-white hover:bg-green-600/90">
            Unblock User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

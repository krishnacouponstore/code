"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Loader2 } from "lucide-react"
import type { AdminSlot } from "@/lib/mock-data"

type DeleteSlotDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot: AdminSlot | null
  onConfirm: () => void
}

export function DeleteSlotDialog({ open, onOpenChange, slot, onConfirm }: DeleteSlotDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onConfirm()
    setIsLoading(false)
    onOpenChange(false)
  }

  if (!slot) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-foreground">Delete Coupon?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground pt-2">
            This will delete <span className="font-semibold text-foreground">"{slot.name}"</span> and all associated
            data. This action cannot be undone.
          </AlertDialogDescription>
          {slot.available_stock > 0 && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">{slot.available_stock} unsold codes will also be deleted.</span>
              </p>
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border text-foreground"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading}
          >
            {isLoading ? (
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

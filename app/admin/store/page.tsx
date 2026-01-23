"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { AdminHeader } from "@/components/admin/admin-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAdminStores, useDeleteStore, AdminStore } from "@/hooks/use-admin-stores"
import { Plus, Search, Store as StoreIcon, Loader2, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { StoreFormModal } from "@/components/admin/store-form-modal"
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
import { useToast } from "@/hooks/use-toast"

export default function AdminStoresPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { data: stores = [], isLoading: storesLoading } = useAdminStores()
  const deleteStoreMutation = useDeleteStore()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<AdminStore | null>(null)
  const [storeToDelete, setStoreToDelete] = useState<AdminStore | null>(null)

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateStore = () => {
    setSelectedStore(null)
    setIsStoreModalOpen(true)
  }

  const handleEditStore = (store: AdminStore) => {
    setSelectedStore(store)
    setIsStoreModalOpen(true)
  }

  const handleDeleteStore = (store: AdminStore) => {
    setStoreToDelete(store)
  }

  const handleConfirmDelete = async () => {
    if (storeToDelete) {
        try {
            const result = await deleteStoreMutation.mutateAsync(storeToDelete.id)
            if (result.success) {
                toast({ title: "Store deleted", description: "Store has been permanently removed." })
            } else {
                throw new Error(result.error)
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setStoreToDelete(null)
        }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Manage Stores</h1>
                <p className="text-muted-foreground mt-1">View and manage all brand stores</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search stores..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-full"
                    />
                </div>
                <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                    onClick={handleCreateStore}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Store
                </Button>
            </div>
        </div>

        {/* Loading State */}
        {storesLoading ? (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : filteredStores.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <StoreIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No stores found</h3>
                <p className="text-muted-foreground mt-1">Try adjusting your search or add a new store.</p>
            </div>
        ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead>Store</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Slots</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStores.map((store) => (
                            <TableRow key={store.id} className="border-border hover:bg-secondary/50">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-[var(--surface-color)] p-1 border border-border flex items-center justify-center overflow-hidden" style={{ backgroundColor: store.theme_color ? `${store.theme_color}10` : undefined }}>
                                            {store.logo_url ? (
                                                <img src={store.logo_url} alt={store.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <StoreIcon className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{store.name}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{store.category}</TableCell>
                                <TableCell>
                                    <Badge variant={store.status === 'active' ? 'default' : 'secondary'} className={store.status === 'active' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}>
                                        {store.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {store.slots_aggregate?.aggregate?.count || 0}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => handleEditStore(store)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteStore(store)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )}

        <StoreFormModal 
            open={isStoreModalOpen} 
            onOpenChange={setIsStoreModalOpen} 
            store={selectedStore}
            onSuccess={() => setIsStoreModalOpen(false)}
        />

        <AlertDialog open={!!storeToDelete} onOpenChange={(open) => !open && setStoreToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the store "{storeToDelete?.name}" and all associated data.
                        {/* Note: This might fail if there are dependent slots, handled by DB constraints usually */}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}

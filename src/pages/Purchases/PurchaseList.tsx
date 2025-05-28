
import { useState } from "react";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePurchases } from "@/hooks/purchases/usePurchases";
import { PurchaseFormDialog } from "@/components/purchases/PurchaseFormDialog";
import { formatCurrency } from "@/lib/utils";

export default function PurchaseList() {
  const {
    purchases,
    isLoading,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    deletePurchase,
    isDeleting,
  } = usePurchases();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null);

  const handleDeleteClick = (purchaseId: string) => {
    setPurchaseToDelete(purchaseId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (purchaseToDelete) {
      deletePurchase(purchaseToDelete);
      setDeleteDialogOpen(false);
      setPurchaseToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      completed: "default",
      cancelled: "destructive",
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchases</h1>
          <p className="text-muted-foreground">Manage your supplier purchases and inventory</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Purchase
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>
            Track and manage all your purchase orders from suppliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No purchases found</p>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(true)}
                className="mt-2"
              >
                Create your first purchase
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">
                      {purchase.purchase_number}
                    </TableCell>
                    <TableCell>
                      {purchase.supplier?.name || "No Supplier"}
                    </TableCell>
                    <TableCell>
                      {new Date(purchase.purchase_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(purchase.total_amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(purchase.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteClick(purchase.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PurchaseFormDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the purchase
              and all associated items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


import React from "react";
import { useNavigate } from "react-router-dom";
import { PurchaseForm } from "@/components/purchases/PurchaseForm";
import { usePurchases } from "@/hooks/purchases/usePurchases";
import { PurchaseFormData } from "@/types/purchase";

export const PurchaseNew = () => {
  const navigate = useNavigate();
  const { createPurchase } = usePurchases();

  const handleSubmit = async (data: PurchaseFormData) => {
    try {
      await createPurchase(data);
      navigate('/purchases');
    } catch (error) {
      console.error('Error creating purchase:', error);
    }
  };

  const handleCancel = () => {
    navigate('/purchases');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Purchase</h1>
        <p className="text-muted-foreground">Add materials to inventory from suppliers</p>
      </div>
      
      <PurchaseForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
};


import { useEffect } from "react";
import { useStockForm } from "@/hooks/inventory/use-stock-form";
import { useSuppliers } from "@/hooks/inventory/use-suppliers";
import { useQuery } from "@tanstack/react-query";
import { StockFormHeader } from "./StockFormHeader";
import { MaterialInfoCard } from "./MaterialInfoCard";
import { QuantityUnitsCard } from "./QuantityUnitsCard";
import { CostInfoCard } from "./CostInfoCard";

const StockJournalForm = ({ id }: { id?: string }) => {
  const {
    formData,
    submitting,
    handleChange,
    handleCheckboxChange,
    handleSelectChange,
    handleSubmit,
    loadStockData
  } = useStockForm(id);

  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers();

  // Fetch stock data if editing
  const { isLoading: loadingStock } = useQuery({
    queryKey: ['inventory', id],
    queryFn: async () => {
      if (!id) return null;
      return loadStockData(id);
    },
    enabled: !!id,
  });

  const unitOptions = ["Meters", "Kilograms", "Pieces", "Rolls", "Yards", "Inches", "Centimeters"];

  return (
    <div className="space-y-6">
      <StockFormHeader isEditing={!!id} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <MaterialInfoCard 
          formData={formData} 
          suppliers={suppliers} 
          handleChange={handleChange} 
          handleSelectChange={handleSelectChange}
        />

        <QuantityUnitsCard 
          formData={formData} 
          unitOptions={unitOptions} 
          handleChange={handleChange} 
          handleSelectChange={handleSelectChange}
        />

        <CostInfoCard 
          formData={formData} 
          id={id}
          submitting={submitting} 
          handleChange={handleChange} 
          handleCheckboxChange={handleCheckboxChange}
        />
      </form>
    </div>
  );
};

export default StockJournalForm;

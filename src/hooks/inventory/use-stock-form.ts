
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type StockFormData = {
  material_type: string;
  color: string;
  gsm: string;
  quantity: string;
  unit: string;
  alternate_unit: string;
  conversion_rate: string;
  purchase_price: string;
  selling_price: string;
  track_cost: boolean;
  supplier_id: string;
  reorder_level: string;
}

export const useStockForm = (id?: string) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<StockFormData>({
    material_type: "",
    color: "",
    gsm: "",
    quantity: "0",
    unit: "Meters",
    alternate_unit: "",
    conversion_rate: "1",
    purchase_price: "",
    selling_price: "",
    track_cost: false,
    supplier_id: "",
    reorder_level: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const loadStockData = async (stockId: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', stockId)
        .single();
        
      if (error) throw error;
      
      setFormData({
        material_type: data.material_type || "",
        color: data.color || "",
        gsm: data.gsm || "",
        quantity: data.quantity?.toString() || "0",
        unit: data.unit || "Meters",
        alternate_unit: data.alternate_unit || "",
        conversion_rate: data.conversion_rate?.toString() || "1",
        purchase_price: data.purchase_price?.toString() || "",
        selling_price: data.selling_price?.toString() || "",
        track_cost: data.track_cost || false,
        supplier_id: data.supplier_id || "",
        reorder_level: data.reorder_level?.toString() || "",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error loading stock data:', error);
      toast.error(`Failed to load stock data: ${error.message}`);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.material_type || !formData.unit) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    
    try {
      const stockData = {
        material_type: formData.material_type,
        color: formData.color || null,
        gsm: formData.gsm || null,
        quantity: parseFloat(formData.quantity) || 0,
        unit: formData.unit,
        alternate_unit: formData.alternate_unit || null,
        conversion_rate: parseFloat(formData.conversion_rate) || 1,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        selling_price: formData.selling_price ? parseFloat(formData.selling_price) : null,
        track_cost: formData.track_cost,
        supplier_id: formData.supplier_id || null,
        reorder_level: formData.reorder_level ? parseFloat(formData.reorder_level) : null,
      };
      
      if (id) {
        // Update existing stock
        const { error } = await supabase
          .from('inventory')
          .update(stockData)
          .eq('id', id);
          
        if (error) throw error;
        
        toast.success("Stock updated successfully");
      } else {
        // Create new stock
        const { error } = await supabase
          .from('inventory')
          .insert([stockData]);
          
        if (error) throw error;
        
        toast.success("Stock added successfully");
      }
      
      navigate('/inventory/stock');
    } catch (error: any) {
      console.error('Error saving stock:', error);
      toast.error(`Failed to save stock: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    formData,
    submitting,
    handleChange,
    handleCheckboxChange,
    handleSelectChange,
    handleSubmit,
    loadStockData
  };
};


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ProductDetails, Component, CustomComponent } from "../types";

export const useFormSubmission = (id?: string, isEditMode = false) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (
    productDetails: ProductDetails,
    components: Record<string, Component>,
    customComponents: CustomComponent[],
    totalCost: number
  ) => {
    setSubmitting(true);
    
    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const productPayload = {
        name: productDetails.name,
        description: productDetails.description,
        bag_length: Number(productDetails.bag_length),
        bag_width: Number(productDetails.bag_width),
        height: Number(productDetails.height),
        default_quantity: productDetails.default_quantity ? Number(productDetails.default_quantity) : 1,
        default_rate: productDetails.default_rate ? Number(productDetails.default_rate) : null,
        cutting_charge: productDetails.cutting_charge ? Number(productDetails.cutting_charge) : 0,
        printing_charge: productDetails.printing_charge ? Number(productDetails.printing_charge) : 0,
        stitching_charge: productDetails.stitching_charge ? Number(productDetails.stitching_charge) : 0,
        transport_charge: productDetails.transport_charge ? Number(productDetails.transport_charge) : 0,
        total_cost: totalCost > 0 ? totalCost : null,
      };
      
      let catalogId = id;
      
      if (isEditMode) {
        // Update existing product
        const { error: catalogError } = await supabase
          .from("catalog")
          .update({
            ...productPayload,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
        
        if (catalogError) {
          throw catalogError;
        }
        
        // Delete existing components to replace with new ones
        const { error: deleteComponentsError } = await supabase
          .from("catalog_components")
          .delete()
          .eq('catalog_id', id);
        
        if (deleteComponentsError) {
          throw deleteComponentsError;
        }
      } else {
        // Insert new product
        const { data: catalogData, error: catalogError } = await supabase
          .from("catalog")
          .insert({
            ...productPayload,
            created_by: userData.user?.id
          })
          .select('id')
          .single();
        
        if (catalogError) {
          if (catalogError.code === '23505') { // Unique constraint violation
            toast({
              title: "Product already exists",
              description: "A product with this name already exists. Please choose a different name.",
              variant: "destructive"
            });
            setSubmitting(false);
            return;
          }
          throw catalogError;
        }
        
        catalogId = catalogData.id;
      }
      
      // Prepare component data for insertion
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents
      ].filter(Boolean);
      
      if (allComponents.length > 0 && catalogId) {
        const componentsToInsert = allComponents.map(comp => {
          const baseComponent = {
            catalog_id: catalogId,
            component_type: comp.type === 'custom' ? (comp as CustomComponent).custom_name : comp.type,
            size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
            length: comp.length ? Number(comp.length) : null,
            width: comp.width ? Number(comp.width) : null,
            color: comp.color || null,
            gsm: comp.gsm ? Number(comp.gsm) : null,
            material_id: comp.material_id && comp.material_id !== 'not_applicable' ? comp.material_id : null,
            roll_width: comp.roll_width ? Number(comp.roll_width) : null,
            consumption: comp.consumption ? Number(comp.consumption) : null
          };
          
          // Add custom_name for custom components
          if (comp.type === 'custom') {
            return {
              ...baseComponent,
              custom_name: (comp as CustomComponent).custom_name
            };
          }
          
          return baseComponent;
        });

        const { error: componentsError } = await supabase
          .from("catalog_components")
          .insert(componentsToInsert);
        
        if (componentsError) {
          console.error("Error saving components:", componentsError);
          toast({
            title: "Error saving components",
            description: componentsError.message,
            variant: "destructive"
          });
        }
      }
      
      toast({
        title: isEditMode ? "Product updated successfully" : "Product created successfully",
        description: `Product "${productDetails.name}" has been ${isEditMode ? 'updated in' : 'added to'} catalog`
      });
      
      // Navigate to the catalog list
      navigate("/inventory/catalog");
      
    } catch (error: any) {
      console.error(isEditMode ? "Error updating product:" : "Error creating product:", error);
      
      // Handle specific server-side validation errors from Supabase
      if (error.code === '23514') { // Check constraint violation
        toast({
          title: "Validation error",
          description: "One or more values failed server-side validation. Please check your input and try again.",
          variant: "destructive"
        });
      } else if (error.code === '23502') { // Not null violation
        toast({
          title: "Missing required field",
          description: "A required field is missing. Please check your input and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: isEditMode ? "Error updating product" : "Error creating product",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return { submitting, handleSubmit };
};

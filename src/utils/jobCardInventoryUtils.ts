import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/components/ui/enhanced-toast";

/**
 * Interface for order component data
 */
interface OrderComponent {
  id: string;
  material_id: string;
  consumption: number;
  component_type: string;
  material?: {
    id: string;
    material_name: string;
    unit: string;
  };
}

/**
 * Interface for job card data
 */
interface JobCardData {
  id: string;
  job_number: string;
  order_id: string;
  order?: {
    order_number: string;
  };
}

/**
 * Interface for reverted material result
 */
interface RevertedMaterial {
  id: string;
  name: string;
  previous: number;
  new: number;
  restored: number;
  unit: string;
  componentType: string;
}

/**
 * Reverse material consumption transactions when a job card is deleted
 * This function restores inventory quantities that were consumed during job card creation
 */
export const reverseJobCardMaterialConsumption = async (
  jobCard: JobCardData
): Promise<{ success: boolean; error?: string; revertedMaterials?: RevertedMaterial[] }> => {
  try {
    console.log("========= REVERSING JOB CARD MATERIAL CONSUMPTION =========");
    console.log("Job Card ID:", jobCard.id);
    console.log("Job Number:", jobCard.job_number);
    console.log("Order ID:", jobCard.order_id);

    const revertedMaterials: RevertedMaterial[] = [];
    const errors: string[] = [];

    // Get order components that were used for material consumption
    const { data: components, error: componentsError } = await supabase
      .from("order_components")
      .select(`
        id,
        material_id,
        consumption,
        component_type,
        material:inventory(
          id,
          material_name,
          unit
        )
      `)
      .eq("order_id", jobCard.order_id);

    if (componentsError) {
      console.error("Error fetching order components:", componentsError);
      return {
        success: false,
        error: `Failed to fetch order components: ${componentsError.message}`
      };
    }

    if (!components || components.length === 0) {
      console.log("No components found for this order, no material consumption to reverse");
      return { success: true, revertedMaterials: [] };
    }

    console.log(`Found ${components.length} components to reverse`);

    // Get order number for transaction reference
    let orderNumber = jobCard.order?.order_number;
    if (!orderNumber) {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("order_number")
        .eq("id", jobCard.order_id)
        .single();

      if (orderError) {
        console.error("Error fetching order details:", orderError);
        errors.push(`Failed to fetch order details: ${orderError.message}`);
        orderNumber = "Unknown";
      } else {
        orderNumber = orderData.order_number;
      }
    }    // Get original consumption amounts from transaction logs when job card was created
    const { data: originalConsumptionLogs, error: logsError } = await supabase
      .from("inventory_transaction_log")
      .select(`
        material_id,
        quantity,
        metadata
      `)
      .eq("reference_id", jobCard.id)
      .eq("transaction_type", "consumption")
      .eq("reference_type", "JobCard");

    if (logsError) {
      console.error("Error fetching original consumption logs:", logsError);
      errors.push(`Failed to fetch original consumption logs: ${logsError.message}`);
    }

    // Create a map of material_id + component_id/component_type to original consumption quantity
    // This handles cases where the same material is used in multiple components
    const originalConsumptionMap = new Map<string, number>();
    if (originalConsumptionLogs) {
      for (const log of originalConsumptionLogs) {
        if (log.material_id && log.quantity && log.metadata) {
          const originalAmount = Math.abs(log.quantity);
          
          // Safely access metadata properties with type checking
          const metadata = typeof log.metadata === 'object' && log.metadata !== null ? 
            log.metadata as Record<string, unknown> : {};
          const componentId = metadata.component_id as string;
          const componentType = metadata.component_type as string;
          
          // Create a unique key for material + component combination
          const key = componentId ? `${log.material_id}_${componentId}` : `${log.material_id}_${componentType}`;
          originalConsumptionMap.set(key, originalAmount);
          
          console.log(`Found original consumption for material ${log.material_id} in ${componentType}: ${originalAmount} units`);
        }
      }
    }

    console.log(`Found original consumption records for ${originalConsumptionMap.size} material-component combinations`);

    // Process each component to reverse material consumption
    for (const component of components) {
      if (!component.material_id) {
        console.log(`Skipping component ${component.component_type} - no material_id`);
        continue;
      }

      // Look for original consumption amount using material_id + component_id combination
      const componentKey = `${component.material_id}_${component.id}`;
      const componentTypeKey = `${component.material_id}_${component.component_type}`;
      
      // Try component_id first, then fall back to component_type
      const originalConsumption = originalConsumptionMap.get(componentKey) || 
                                 originalConsumptionMap.get(componentTypeKey);
      
      // Use original consumption amount if available, otherwise fall back to current component consumption
      const consumptionQuantity = originalConsumption || component.consumption || 0;

      if (consumptionQuantity <= 0) {
        console.log(`Skipping component ${component.component_type} - no consumption amount found (original: ${originalConsumption}, current: ${component.consumption})`);
        continue;
      }

      const materialName = component.material?.material_name || "Unknown Material";
      const materialUnit = component.material?.unit || "";

      if (originalConsumption) {
        console.log(`Reversing ${component.component_type}: restoring ${consumptionQuantity} units of ${materialName} (using ORIGINAL component-specific consumption)`);
      } else {
        console.log(`Reversing ${component.component_type}: restoring ${consumptionQuantity} units of ${materialName} (using current consumption amount as fallback)`);
      }

      try {
        // Get current inventory quantity
        const { data: currentInventory, error: fetchError } = await supabase
          .from("inventory")
          .select("quantity, material_name")
          .eq("id", component.material_id)
          .single();

        if (fetchError) {
          console.error(`Error fetching inventory for ${component.material_id}:`, fetchError);
          errors.push(`Failed to fetch inventory for ${materialName}: ${fetchError.message}`);
          continue;
        }

        const previousQuantity = currentInventory.quantity || 0;
        const newQuantity = previousQuantity + consumptionQuantity; // Restore the consumed quantity

        // Update inventory quantity
        const { error: updateError } = await supabase
          .from("inventory")
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq("id", component.material_id);

        if (updateError) {
          console.error(`Error updating inventory for ${component.material_id}:`, updateError);
          errors.push(`Failed to update inventory for ${materialName}: ${updateError.message}`);
          continue;
        }

        // Create inventory transaction log for the reversal
        const { error: logError } = await supabase
          .from("inventory_transaction_log")
          .insert({
            material_id: component.material_id,
            transaction_type: "job-card-reversal",
            quantity: consumptionQuantity, // Positive quantity since we're restoring
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            reference_id: jobCard.id,
            reference_number: jobCard.job_number,
            reference_type: "JobCard",
            notes: `Material consumption reversal for job card deletion - restored ${consumptionQuantity} units from ${component.component_type} component (Order: ${orderNumber})`,
            metadata: {
              material_name: materialName,
              unit: materialUnit,
              component_type: component.component_type,
              component_id: component.id,
              consumption_quantity: consumptionQuantity,
              order_id: jobCard.order_id,
              order_number: orderNumber,
              reversal: true,
              job_card_id: jobCard.id,
              job_number: jobCard.job_number
            },
            transaction_date: new Date().toISOString()
          });

        if (logError) {
          console.error(`Error creating reversal transaction log for ${component.material_id}:`, logError);
          errors.push(`Failed to create reversal transaction log for ${materialName}: ${logError.message}`);
          // Continue even if log creation fails, as the inventory was already updated
        }

        revertedMaterials.push({
          id: component.material_id,
          name: materialName,
          previous: previousQuantity,
          new: newQuantity,
          restored: consumptionQuantity,
          unit: materialUnit,
          componentType: component.component_type
        });

        console.log(`✓ Successfully reverted ${materialName} for ${component.component_type}`);
      } catch (itemError: unknown) {
        console.error(`Error reversing component ${component.component_type}:`, itemError);
        const errorMessage = itemError instanceof Error ? itemError.message : 'Unknown error';
        errors.push(`Failed to reverse ${component.component_type}: ${errorMessage}`);
      }
    }

    console.log("========= REVERSAL SUMMARY =========");
    console.log(`Successfully reverted: ${revertedMaterials.length} materials`);
    console.log(`Errors: ${errors.length}`);

    // Show user feedback
    if (revertedMaterials.length > 0) {
      showToast({
        title: "Material consumption reversed",
        description: `Restored inventory for ${revertedMaterials.length} materials${errors.length > 0 ? ` (${errors.length} errors)` : ''}`,
        type: "success"
      });
    }

    if (errors.length > 0) {
      console.error("Reversal errors:", errors);
      showToast({
        title: "Some materials failed to reverse",
        description: `${errors.length} materials could not be restored. Check console for details.`,
        type: "error"
      });
    }

    return {
      success: revertedMaterials.length > 0 || errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      revertedMaterials
    };
  } catch (error: unknown) {
    console.error("Error in reverseJobCardMaterialConsumption:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during job card material reversal';
    
    showToast({
      title: "Error reversing material consumption",
      description: errorMessage,
      type: "error"
    });

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Validate that a job card can be safely deleted (check for dependencies)
 */
export const validateJobCardDeletion = async (
  jobCardId: string
): Promise<{ canDelete: boolean; warnings: string[] }> => {
  const warnings: string[] = [];

  try {
    // Check for cutting jobs
    const { data: cuttingJobs, error: cuttingError } = await supabase
      .from('cutting_jobs')
      .select('id, status')
      .eq('job_card_id', jobCardId);

    if (cuttingError) {
      console.error("Error checking cutting jobs:", cuttingError);
      warnings.push("Could not verify cutting job dependencies");
    } else if (cuttingJobs && cuttingJobs.length > 0) {
      const completedCuttingJobs = cuttingJobs.filter(job => job.status === 'completed');
      if (completedCuttingJobs.length > 0) {
        warnings.push(`${completedCuttingJobs.length} completed cutting job(s) will be deleted`);
      }
    }

    // Check for printing jobs
    const { data: printingJobs, error: printingError } = await supabase
      .from('printing_jobs')
      .select('id, status')
      .eq('job_card_id', jobCardId);

    if (printingError) {
      console.error("Error checking printing jobs:", printingError);
      warnings.push("Could not verify printing job dependencies");
    } else if (printingJobs && printingJobs.length > 0) {
      const completedPrintingJobs = printingJobs.filter(job => job.status === 'completed');
      if (completedPrintingJobs.length > 0) {
        warnings.push(`${completedPrintingJobs.length} completed printing job(s) will be deleted`);
      }
    }

    // Check for stitching jobs
    const { data: stitchingJobs, error: stitchingError } = await supabase
      .from('stitching_jobs')
      .select('id, status')
      .eq('job_card_id', jobCardId);

    if (stitchingError) {
      console.error("Error checking stitching jobs:", stitchingError);
      warnings.push("Could not verify stitching job dependencies");
    } else if (stitchingJobs && stitchingJobs.length > 0) {
      const completedStitchingJobs = stitchingJobs.filter(job => job.status === 'completed');
      if (completedStitchingJobs.length > 0) {
        warnings.push(`${completedStitchingJobs.length} completed stitching job(s) will be deleted`);
      }
    }

    return {
      canDelete: true, // Allow deletion but show warnings
      warnings
    };
  } catch (error) {
    console.error("Error validating job card deletion:", error);
    return {
      canDelete: true, // Allow deletion even if validation fails
      warnings: ["Could not fully validate job card dependencies"]
    };
  }
};

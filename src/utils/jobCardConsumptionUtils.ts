import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/components/ui/enhanced-toast";
import { 
  JobCardConsumption, 
  JobCardConsumptionInput, 
  JobCardConsumptionCreateResult,
  JobCardConsumptionBatchResult 
} from "@/types/jobCardConsumption";

/**
 * Create a single job card consumption record
 */
export const createJobCardConsumption = async (
  input: JobCardConsumptionInput
): Promise<JobCardConsumptionCreateResult> => {
  try {
    console.log("Creating job card consumption record:", input);

    const { data, error } = await supabase
      .from("job_card_consumptions")
      .insert({
        job_card_id: input.job_card_id,
        material_id: input.material_id,
        component_type: input.component_type,
        consumption_amount: input.consumption_amount,
        unit: input.unit,
        material_name: input.material_name,
        order_id: input.order_id,
        order_number: input.order_number,
        metadata: input.metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating job card consumption:", error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log("✓ Job card consumption record created:", data);
    return {
      success: true,
      data: data as JobCardConsumption
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in createJobCardConsumption:", error);
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Create multiple job card consumption records in batch
 */
export const createJobCardConsumptionBatch = async (
  jobCardId: string,
  jobNumber: string,
  orderId: string,
  orderNumber: string,
  components: Array<{
    material_id: string;
    component_type: string;
    consumption: number;
    material?: {
      material_name: string;
      unit: string;
    };
    metadata?: Record<string, any>;
  }>
): Promise<JobCardConsumptionBatchResult> => {
  console.log("=== CREATING JOB CARD CONSUMPTION BATCH ===");
  console.log("Job Card:", jobNumber, "Order:", orderNumber);
  console.log("Components to process:", components.length);

  const created: JobCardConsumption[] = [];
  const errors: string[] = [];
  let processedCount = 0;

  for (const component of components) {
    processedCount++;

    // Skip components without material or consumption
    if (!component.material_id || !component.consumption || component.consumption <= 0) {
      console.log(`Skipping component ${component.component_type}: No material or consumption`);
      continue;
    }

    if (!component.material) {
      errors.push(`Component ${component.component_type}: Missing material details`);
      continue;
    }

    const input: JobCardConsumptionInput = {
      job_card_id: jobCardId,
      material_id: component.material_id,
      component_type: component.component_type,
      consumption_amount: component.consumption,
      unit: component.material.unit,
      material_name: component.material.material_name,
      order_id: orderId,
      order_number: orderNumber,
      metadata: component.metadata || {}
    };

    const result = await createJobCardConsumption(input);

    if (result.success && result.data) {
      created.push(result.data);
      console.log(`✓ Created consumption record: ${component.component_type} - ${component.material.material_name} (${component.consumption} ${component.material.unit})`);
    } else {
      const errorMsg = `Failed to create consumption record for ${component.component_type}: ${result.error}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  const successCount = created.length;
  const errorCount = errors.length;

  console.log(`Batch creation complete: ${successCount} successful, ${errorCount} errors`);

  // Show user feedback
  if (successCount > 0) {
    showToast({
      title: "Job card consumption recorded",
      description: `Recorded consumption for ${successCount} materials${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
      type: "success"
    });
  }

  if (errorCount > 0) {
    showToast({
      title: "Some consumption records failed",
      description: `${errorCount} materials failed to record consumption`,
      type: "error"
    });
  }

  return {
    success: errorCount === 0,
    created,
    errors,
    totalProcessed: processedCount,
    successCount,
    errorCount
  };
};

/**
 * Get job card consumption records for a specific job card
 */
export const getJobCardConsumptions = async (
  jobCardId: string
): Promise<{ success: boolean; data?: JobCardConsumption[]; error?: string }> => {
  try {
    console.log("Fetching job card consumptions for:", jobCardId);

    const { data, error } = await supabase
      .from("job_card_consumptions")
      .select("*")
      .eq("job_card_id", jobCardId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching job card consumptions:", error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log(`✓ Found ${data?.length || 0} consumption records`);
    return {
      success: true,
      data: data as JobCardConsumption[]
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in getJobCardConsumptions:", error);
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Delete job card consumption records for a specific job card
 * This is automatically handled by CASCADE DELETE in the database
 * but this function can be used for explicit cleanup if needed
 */
export const deleteJobCardConsumptions = async (
  jobCardId: string
): Promise<{ success: boolean; deletedCount?: number; error?: string }> => {
  try {
    console.log("Deleting job card consumption records for:", jobCardId);

    const { data, error } = await supabase
      .from("job_card_consumptions")
      .delete()
      .eq("job_card_id", jobCardId)
      .select();

    if (error) {
      console.error("Error deleting job card consumptions:", error);
      return {
        success: false,
        error: error.message
      };
    }

    const deletedCount = data?.length || 0;
    console.log(`✓ Deleted ${deletedCount} consumption records`);
    
    return {
      success: true,
      deletedCount
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in deleteJobCardConsumptions:", error);
    return {
      success: false,
      error: errorMessage
    };
  }
};

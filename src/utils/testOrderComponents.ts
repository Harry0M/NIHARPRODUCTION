import { supabase } from "@/integrations/supabase/client";

/**
 * Utility function to test inserting components for a given order
 */
export async function testInsertOrderComponents(orderId: string) {
  // Create a simple test component
  const testComponent = {
    order_id: orderId,
    component_type: 'part',
    size: '10x10',
    color: 'Red',
    gsm: 120,
    custom_name: null,
    material_id: null, // No material ID for this test
    roll_width: 30,
    consumption: 5,
    formula: 'standard',
    is_custom: false
  };

  console.log("Test inserting component:", testComponent);

  try {
    const { data, error } = await supabase
      .from('order_components')
      .insert(testComponent)
      .select();

    if (error) {
      console.error("Error inserting test component:", error);
      return { success: false, error };
    }

    console.log("Successfully inserted test component:", data);
    return { success: true, data };
  } catch (err) {
    console.error("Exception inserting test component:", err);
    return { success: false, error: err };
  }
} 
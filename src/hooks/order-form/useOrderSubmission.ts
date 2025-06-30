import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/components/ui/enhanced-toast";
import { OrderFormData } from "@/types/order";
import { validateComponentData, convertStringToNumeric, debugAllComponents } from "@/utils/orderFormUtils";

interface UseOrderSubmissionProps {
  orderDetails: OrderFormData;
  components: Record<string, any>;
  customComponents: any[];
  validateForm: () => boolean;
  costCalculation: any;
}

/**
 * Hook to handle order submission and database operations
 */
export function useOrderSubmission({
  orderDetails,
  components,
  customComponents,
  validateForm,
  costCalculation
}: UseOrderSubmissionProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent, orderId?: string): Promise<string | undefined> => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Perform pre-submission validation of component types
      const componentsList = [
        ...Object.values(components).filter(Boolean),
        ...customComponents
      ].filter(Boolean);
      
      // Check for invalid component types before attempting to save
      const validComponentTypes = ['part', 'border', 'handle', 'chain', 'runner', 'custom', 'piping'];
      const invalidComponents = componentsList.filter(comp => {
        const type = comp.type?.toLowerCase() || '';
        return !validComponentTypes.includes(type);
      });
      
      if (invalidComponents.length > 0) {
        console.error("Found components with invalid types that will fail database constraint:");
        invalidComponents.forEach(comp => {
          console.error(`Component with invalid type: "${comp.type}" - must be one of: ${validComponentTypes.join(', ')}`);
        });
        
        // Show warning toast
        showToast({
          title: "Warning: Invalid Component Types",
          description: `Found ${invalidComponents.length} components with invalid types that might fail to save.`,
          type: "warning"
        });
      }
      
      // Debug all components before submission to help identify issues
      console.log('=== ORDER SUBMISSION START ===');
      console.log('Order Quantity:', orderDetails.quantity || orderDetails.total_quantity);
      console.log('Catalog ID:', orderDetails.catalog_id);
      
      // SIMPLIFIED COST FETCHING: Get raw costs from catalog template and multiply by order quantity
      let materialCost = 0;
      let cuttingCharge = 0;
      let printingCharge = 0;
      let stitchingCharge = 0;
      let transportCharge = 0;
      let margin = 15; // Default margin
      let sellingRate = 0;
      
      // If catalog_id is provided, fetch raw costs from the catalog template
      if (orderDetails.catalog_id) {
        try {
          console.log('Fetching raw cost data from catalog template:', orderDetails.catalog_id);
          
          const { data: catalogData, error: catalogError } = await supabase
            .from('catalog')
            .select(`
              material_cost,
              cutting_charge,
              printing_charge,
              stitching_charge,
              transport_charge,
              margin,
              selling_rate
            `)
            .eq('id', orderDetails.catalog_id)
            .single();
            
          if (catalogError) {
            console.error('Error fetching catalog cost data:', catalogError);
            showToast({
              title: "Warning: Could not fetch template costs",
              description: "Using default values",
              type: "warning"
            });
          } else if (catalogData) {
            console.log('Raw catalog cost data fetched:', catalogData);
            
            // Get order quantity for multiplication
            const orderQuantity = parseInt(orderDetails.order_quantity || orderDetails.quantity || '1');
            
            // MULTIPLY BY ORDER QUANTITY: Material cost, production costs, and transport charges
            materialCost = (catalogData.material_cost || 0) * orderQuantity;
            cuttingCharge = (catalogData.cutting_charge || 0) * orderQuantity;
            printingCharge = (catalogData.printing_charge || 0) * orderQuantity;
            stitchingCharge = (catalogData.stitching_charge || 0) * orderQuantity;
            transportCharge = (catalogData.transport_charge || 0) * orderQuantity;
            margin = catalogData.margin || 15;
            sellingRate = (catalogData.selling_rate || 0) * orderQuantity;
            
            console.log('Costs calculated (multiplied by order quantity):', {
              orderQuantity,
              materialCost,
              cuttingCharge,
              printingCharge,
              stitchingCharge,
              transportCharge,
              margin,
              sellingRate
            });
          }
        } catch (error) {
          console.error('Exception fetching catalog costs:', error);
          showToast({
            title: "Warning: Error fetching template costs",
            description: "Using default values",
            type: "warning"
          });
        }
      } else {
        // No catalog template, use default values
        console.log('No catalog template selected, using default cost values');
        sellingRate = parseFloat(orderDetails.rate || '0');
      }
      
      // Prepare data for database insert/update
      // First, validate that the sales_account_id (company_id) exists if provided
      let validatedSalesAccountId = null;
      let companyName = orderDetails.company_name || "";
      
      // If sales_account_id is provided, verify it exists in the companies table
      if (orderDetails.sales_account_id) {
        try {
          // Check if the company exists in the database
          const { data: companyData, error: companyError } = await supabase
            .from("companies")
            .select("id, name")
            .eq("id", orderDetails.sales_account_id)
            .single();
          
          if (companyError) {
            console.warn("Company validation error:", companyError);
            // Company ID is invalid, so we'll use null to avoid foreign key errors
          } else if (companyData) {
            // Company exists, so we can use the ID
            validatedSalesAccountId = companyData.id;
            // If company_name is empty, use the company name from the database
            if (!companyName || companyName.trim() === "") {
              companyName = companyData.name;
              console.log("Using company name from database:", companyName);
            }
          }
        } catch (err) {
          console.error("Error validating company:", err);
          // On error, default to null for safety
        }
      }
      
      // If company_name is still empty but company_id exists, use a default name
      if ((!companyName || companyName.trim() === "") && orderDetails.company_id) {
        companyName = "Company ID: " + orderDetails.company_id;
        console.log("Warning: Using default company name because company_name was empty", {
          company_id: orderDetails.company_id,
          defaultName: companyName
        });
      }
      
      // Always ensure company_name has a value to satisfy the not-null constraint
      if (!companyName || companyName.trim() === "") {
        companyName = "Unnamed Company";
        console.log("Warning: Using 'Unnamed Company' as company_name was empty and no company_id was provided");
      }
      
      const orderData = {
        company_name: companyName, // Always provide a non-null value
        company_id: orderDetails.company_id,
        quantity: parseInt(orderDetails.total_quantity || orderDetails.quantity), // Use total quantity for the order
        order_quantity: parseInt(orderDetails.order_quantity || orderDetails.quantity || '1'), // Add order_quantity field
        bag_length: parseFloat(orderDetails.bag_length),
        bag_width: parseFloat(orderDetails.bag_width),
        border_dimension: orderDetails.border_dimension ? parseFloat(orderDetails.border_dimension) : null,
        rate: sellingRate,
        order_date: orderDetails.order_date,
        order_number: orderDetails.order_number || null, // Manual order number entry (null for auto-generation)
        // Use the validated sales_account_id to prevent foreign key constraint errors
        sales_account_id: validatedSalesAccountId,
        catalog_id: orderDetails.catalog_id || null,
        special_instructions: orderDetails.special_instructions || null,
        // Costs multiplied by order quantity: material cost, production costs, and transport charges
        material_cost: materialCost,
        cutting_charge: cuttingCharge,
        printing_charge: printingCharge,
        stitching_charge: stitchingCharge,
        transport_charge: transportCharge,
        production_cost: cuttingCharge + printingCharge + stitchingCharge + transportCharge,
        total_cost: materialCost + cuttingCharge + printingCharge + stitchingCharge + transportCharge,
        margin: margin,
        calculated_selling_price: sellingRate
      };

      console.log("Submitting order data:", orderData);
      
      let orderResult = null;
      
      if (orderId) {
        // Update existing order
        const { data, error } = await supabase
          .from("orders")
          .update(orderData)
          .eq("id", orderId)
          .select('id, order_number')
          .single();
          
        if (error) throw error;
        orderResult = data;
        
        // Delete existing components
        const { error: deleteError } = await supabase
          .from("order_components")
          .delete()
          .eq("order_id", orderId);
          
        if (deleteError) throw deleteError;
      } else {
        // Create new order
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts && !orderResult) {
          attempts++;
          
          try {
            const { data, error } = await supabase
              .from("orders")
              .insert(orderData as any)
              .select('id, order_number')
              .single();
            
            if (error) {
              console.error(`Order insertion attempt ${attempts} error:`, error);
              
              // If it's not a duplicate key error or we've reached max attempts, throw the error
              if (error.code !== '23505' || attempts >= maxAttempts) {
                throw error;
              }
              
              // For duplicate key errors, wait briefly and retry
              await new Promise(resolve => setTimeout(resolve, 100 * attempts));
            } else {
              orderResult = data;
              break;
            }
          } catch (insertError) {
            if (attempts >= maxAttempts) {
              throw insertError;
            }
          }
        }
        
        if (!orderResult) {
          throw new Error("Failed to create order after multiple attempts");
        }
      }
      
      console.log("Order saved successfully:", orderResult);
      
      // Process components if any exist
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents
      ].filter(Boolean);
      
      console.log("Raw components to be saved:", allComponents);
      console.log("Number of components before validation:", allComponents.length);
      
      // IMPORTANT: DO NOT multiply consumption by order quantity again - it's already done in useOrderComponents.ts
      // MULTIPLY fetched costs and consumption by order quantity and save
      const orderQuantity = parseInt(orderDetails.order_quantity || orderDetails.quantity || '1');
      console.log("Order quantity for multiplication:", orderQuantity);
      
      // For each component, multiply consumption and costs by order quantity
      const processedComponents = allComponents.map(comp => {
        // Fetch the original per-unit consumption from the product template (fetchedConsumption)
        const perUnitConsumption = parseFloat(comp.fetchedConsumption) || 0;
        const totalConsumption = perUnitConsumption * orderQuantity;
        console.log(`%c DB SAVE: ${comp.type} (formula: ${comp.formula}, is_manual_consumption: ${comp.is_manual_consumption}) - Saving: fetchedConsumption=${perUnitConsumption}, totalConsumption=${totalConsumption}`,
          'background: #4CAF50; color: white; padding: 2px 5px; font-weight: bold;');
        return {
          ...comp,
          consumption: totalConsumption
        };
      });
      
      if (processedComponents.length > 0) {
        // Create a properly formatted array of components with correct data types
        const componentsToInsert = processedComponents
          .filter(comp => {
            const isValid = validateComponentData(comp);
            if (!isValid) {
              console.error("Component validation failed:", comp);
            }
            return isValid;
          })
          .map(comp => {
            // CRITICAL FIX: Log the raw component data to see exactly what we're dealing with
            console.log("RAW COMPONENT DATA:", JSON.stringify(comp, null, 2));
            
            // Determine correct component type - IMPORTANT: convert to lowercase to match database enum
            // The database expects component_type in lowercase, but UI might display it with capitalization
            let componentTypeRaw = comp.type?.toLowerCase() || '';
            
            // Handle null/undefined component type
            if (!componentTypeRaw) {
              console.warn('Component with missing type, defaulting to "part":', comp);
              componentTypeRaw = 'part';
            }
            
            // Explicitly force to lowercase string to ensure format matches database constraint
            // This is critical - the database constraint expects exact lowercase values
            let componentType = String(componentTypeRaw || '').toLowerCase().trim();
            
            // Ensure component_type is EXACTLY one of the valid values - this is critical for the database constraint
            // The database has a check constraint: "order_components_component_type_check"
            const validComponentTypes = ['part', 'border', 'handle', 'chain', 'runner', 'custom', 'piping'];
            
            // Log exact character codes to debug any hidden characters
            console.log(`Component type "${componentType}" character codes:`, 
              Array.from(componentType).map(c => c.charCodeAt(0)));
            
            if (!validComponentTypes.includes(componentType)) {
              console.warn(`Invalid component type "${componentType}" - must be one of: ${validComponentTypes.join(', ')}`);
              console.warn('Original component data:', comp);
              
              // STRICT APPROACH: Instead of trying to normalize, just force to a valid value
              componentType = 'part'; // Default to 'part' as the safest option
              
              console.log(`Forced component type to '${componentType}'`);
            }
            
            console.log(`Final component_type value being sent to database: '${componentType}'`);
            
            // Ensure formula is set
            const formula = comp.formula || 'standard';
            
            // Use proper size formatting or null
            const size = comp.length && comp.width 
              ? `${comp.length}x${comp.width}` 
              : null;
            
            // Get the appropriate custom name based on component type
            const customName = comp.type === 'custom' ? comp.customName : null;
            
            // Convert string values to numbers where appropriate
            const gsmValue = convertStringToNumeric(comp.gsm);
            const rollWidthValue = convertStringToNumeric(comp.roll_width);
            
            // CORRECTED CONSUMPTION LOGIC: Use the already-processed consumption value
            // The processedComponents array now contains the correct per-unit values
            const perUnitConsumption = convertStringToNumeric(
              typeof comp.consumption === 'string' ? comp.consumption : String(comp.consumption || 0)
            );
            
            // Store the per-unit consumption in database (do not multiply by quantity here)
            // The database should store per-unit values, not total values
            const finalConsumption = perUnitConsumption;
            
            console.log(`💰 MATERIAL RATE: ${comp.materialRate}`);
            console.log(`💵 PER-UNIT COST: ${finalConsumption} × ${comp.materialRate} = ${finalConsumption * (comp.materialRate || 0)}`);
            console.log('---');
            
            const materialCost = convertStringToNumeric(
              typeof comp.materialCost === 'string' ? comp.materialCost : String(comp.materialCost || 0)
            );
            
            // Get component cost breakdown
            const componentCostBreakdown = comp.componentCostBreakdown || null;
            
            // Create the component object with all required fields
            const componentToInsert = {
              order_id: orderResult.id,
              component_type: componentType,
              is_custom: comp.type === 'custom',
              size: size,
              color: comp.color || null,
              gsm: gsmValue,
              custom_name: customName,
              material_id: comp.material_id || null,
              roll_width: rollWidthValue,
              consumption: finalConsumption, // Use the multiplied consumption value
              component_cost: materialCost || null,
              component_cost_breakdown: componentCostBreakdown,
              formula: formula
            };
            
            // FINAL VERIFICATION: Ensure the component strictly meets database requirements
            return verifyComponent(componentToInsert);
          });

        // Additional debug log for final components array
        console.log("Formatted components to insert:", componentsToInsert);
        console.log("Number of components after validation:", componentsToInsert.length);

        // TEST: Check for exact constraint match with values
        testComponentTypes(componentsToInsert);

        if (componentsToInsert.length > 0) {
          const { data: insertedComponents, error: componentsError } = await supabase
            .from("order_components")
            .insert(componentsToInsert)
            .select();
          
          if (componentsError) {
            console.error("Error saving components:", componentsError);
            console.error("Components that failed to save:", componentsToInsert);
            
            // Create a persistent error message that remains in localStorage
            const errorDetails = {
              timestamp: new Date().toISOString(),
              error: {
                message: componentsError.message,
                code: componentsError.code,
                details: componentsError.details || null
              },
              components: componentsToInsert
            };
            
            // Save error details to localStorage for later debugging
            localStorage.setItem('lastComponentSaveError', JSON.stringify(errorDetails, null, 2));
            console.error("%c COMPONENT SAVE ERROR DETAILS SAVED TO localStorage.lastComponentSaveError - CHECK BROWSER CONSOLE", "background: red; color: white; font-size: 16px; padding: 10px;");
            console.error("To view error details, run this in browser console: console.log(JSON.parse(localStorage.getItem('lastComponentSaveError')))");
            
            showToast({
              title: "Error saving components",
              description: componentsError.message,
              type: "error"
            });
          } else {
            console.log("Components saved successfully:", insertedComponents);
            console.log(`Successfully saved ${insertedComponents?.length || 0} components`);
            
            // Success toast for components
            showToast({
              title: "Components saved successfully",
              description: `${insertedComponents?.length || 0} components saved`,
              type: "success"
            });
            
            // NOTE: Material consumption is now calculated when job cards are created, not at order creation
            // This ensures inventory is only decremented when production actually begins
            console.log("Material consumption will be calculated when job cards are created for this order");
          }
        } else {
          console.warn("No components to insert after validation - all components failed validation");
          showToast({
            title: "Warning",
            description: "No valid components found to save with this order.",
            type: "warning"
          });
        }
      } else {
        console.log("No components to save");
      }
      
      // Show success toast
      showToast({
        title: orderId ? "Order Updated" : "Order Created",
        description: `Order #${orderResult.order_number} has been ${orderId ? 'updated' : 'created'} successfully`,
        type: "success"
      });
      
      // Return the order id for navigation
      return orderResult.id;
      
    } catch (error: any) {
      console.error("===== ORDER SUBMISSION ERROR =====");
      console.error(error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details || 'No details available'
      });
      console.error("===== END ERROR DETAILS =====");
      
      // Show error toast
      showToast({
        title: orderId ? "Error updating order" : "Error creating order",
        description: error.message,
        type: "error"
      });
      
      return undefined;
    } finally {
      setSubmitting(false);
    }
  };

  // Function to perform final verification of component data before database insertion
  function verifyComponent(component: any): any {
    // Strictly verify component_type is one of the allowed values
    const validTypes = ['part', 'border', 'handle', 'chain', 'runner', 'custom', 'piping'];
    
    // Ensure component_type exists and is a string
    if (typeof component.component_type !== 'string') {
      console.error(`CRITICAL ERROR: component_type is not a string: ${typeof component.component_type}`);
      component.component_type = 'part';
    } else {
      // Normalize the component_type to ensure it exactly matches the constraint
      component.component_type = component.component_type.toLowerCase().trim();
      
      if (!validTypes.includes(component.component_type)) {
        console.error(`CRITICAL ERROR: Invalid component_type "${component.component_type}" - forcing to "part"`);
        component.component_type = 'part';
      }
    }
    
    // Ensure all required fields exist
    if (!component.order_id) {
      console.error('CRITICAL ERROR: Missing order_id in component');
      throw new Error('Cannot save component without order_id');
    }
    
    // Log the final verified component
    console.log('VERIFIED COMPONENT FOR DATABASE:', component);
    
    return component;
  }

  return {
    submitting,
    handleSubmit
  };
}

// Function to test component types directly
function testComponentTypes(components: any[]) {
  console.log("======== COMPONENT TYPE CONSTRAINT TEST ========");
  
  // Test each component against the exact constraint pattern
  components.forEach((comp, index) => {
    const type = comp.component_type;
    
    if (type === undefined || type === null) {
      console.error(`  - COMPONENT ${index} HAS NULL OR UNDEFINED TYPE`);
      return;
    }
    
    // Check if it's exactly one of the allowed values
    const validTypes = ['part', 'border', 'handle', 'chain', 'runner', 'custom', 'piping'];
    const isExactMatch = validTypes.includes(type);
    
    // Check for case issues
    const hasUppercase = /[A-Z]/.test(type);
    
    // Check for whitespace
    const hasWhitespace = /\s/.test(type);
    
    // Check for special characters
    const hasSpecialChars = /[^a-zA-Z]/.test(type);
    
    // Log the test results
    console.log(`Component ${index} - Type: "${type}"`);
    console.log(`  - Exact match: ${isExactMatch}`);
    console.log(`  - Has uppercase: ${hasUppercase}`);
    console.log(`  - Has whitespace: ${hasWhitespace}`);
    console.log(`  - Has special chars: ${hasSpecialChars}`);
    console.log(`  - Character codes:`, Array.from(String(type)).map(c => c.charCodeAt(0)));
    
    if (!isExactMatch) {
      console.error(`  - COMPONENT ${index} WILL FAIL DATABASE CONSTRAINT`);
    }
  });
  
  console.log("============= END CONSTRAINT TEST =============");
}

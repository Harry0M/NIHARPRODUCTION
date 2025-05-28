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

  const handleSubmit = async (e: React.FormEvent): Promise<string | undefined> => {
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
      debugAllComponents(components, customComponents);
      
      // Calculate margins and selling price
      const materialCost = costCalculation?.materialCost || 0;
      const cuttingCharge = parseFloat(orderDetails.cutting_charge || '0');
      const printingCharge = parseFloat(orderDetails.printing_charge || '0');
      const stitchingCharge = parseFloat(orderDetails.stitching_charge || '0');
      const transportCharge = parseFloat(orderDetails.transport_charge || '0');
      const productionCost = cuttingCharge + printingCharge + stitchingCharge + transportCharge;
      const totalCost = materialCost + productionCost;
      
      // Calculate margin and selling price
      const margin = parseFloat(orderDetails.margin || '15');
      let sellingRate = costCalculation?.sellingPrice || 0;
      
      // Use the calculated selling price from costCalculation if available,
      // otherwise use the rate from orderDetails if specified,
      // or calculate it based on cost and margin
      if (orderDetails.rate && parseFloat(orderDetails.rate) > 0) {
        sellingRate = parseFloat(orderDetails.rate);
      } else if (sellingRate <= 0 && totalCost > 0 && margin > 0) {
        // Calculate selling price: cost / (1 - margin/100)
        sellingRate = totalCost / (1 - margin/100);
      }
      
      console.log("Order calculation:", {
        materialCost,
        productionCost,
        totalCost,
        margin,
        sellingRate
      });
      
      // Prepare data for database insert
      const orderData = {
        company_name: orderDetails.company_id ? null : orderDetails.company_name,
        company_id: orderDetails.company_id,
        quantity: parseInt(orderDetails.total_quantity || orderDetails.quantity), // Use total quantity for the order
        bag_length: parseFloat(orderDetails.bag_length),
        bag_width: parseFloat(orderDetails.bag_width),
        border_dimension: orderDetails.border_dimension ? parseFloat(orderDetails.border_dimension) : null,
        rate: sellingRate,
        order_date: orderDetails.order_date,
        sales_account_id: orderDetails.sales_account_id || null,
        special_instructions: orderDetails.special_instructions || null,
        // Cost calculations
        material_cost: materialCost,
        cutting_charge: parseFloat(orderDetails.cutting_charge || '0'),
        printing_charge: parseFloat(orderDetails.printing_charge || '0'),
        stitching_charge: parseFloat(orderDetails.stitching_charge || '0'),
        transport_charge: parseFloat(orderDetails.transport_charge || '0'),
        production_cost: productionCost,
        total_cost: totalCost,
        margin: margin,
        calculated_selling_price: sellingRate
      };

      console.log("Submitting order data:", orderData);
      
      // Implement retry logic for order insertion
      let orderResult = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts && !orderResult) {
        attempts++;
        
        try {
          // Insert the order - using type assertion to bypass the order_number requirement
          // since this is auto-generated by the database trigger
          const { data, error } = await supabase
            .from("orders")
            .insert(orderData as any) // Use type assertion to bypass TypeScript check
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
            // Success! Store the result and exit the retry loop
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
      
      console.log("Order created successfully:", orderResult);
      
      // Process components if any exist
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents
      ].filter(Boolean);
      
      console.log("Raw components to be saved:", allComponents);
      console.log("Number of components before validation:", allComponents.length);
      
      if (allComponents.length > 0) {
        // Create a properly formatted array of components with correct data types
        const componentsToInsert = allComponents
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
            let componentTypeRaw = comp.type === 'custom' ? 'custom' : comp.type;
            
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
            
            // Convert string values to appropriate types for numeric fields
            const gsmValue = convertStringToNumeric(comp.gsm);
            const rollWidthValue = convertStringToNumeric(comp.roll_width);
            const consumptionValue = convertStringToNumeric(comp.consumption);
            
            // Get material cost if available
            const materialCost = comp.materialCost;
            const componentCostBreakdown = materialCost ? { 
              material_cost: materialCost,
              material_rate: comp.materialRate || 0,
              consumption: consumptionValue
            } : null;
            
            // Debug log for individual component
            console.log(`Preparing component ${componentType}:`, {
              originalType: comp.type,
              normalizedType: componentType,
              originalGsm: comp.gsm,
              originalRollWidth: comp.roll_width,
              originalConsumption: comp.consumption,
              convertedGsm: gsmValue,
              convertedRollWidth: rollWidthValue,
              convertedConsumption: consumptionValue,
              size,
              materialId: comp.material_id || null,
              isCustom: comp.type === 'custom',
              materialCost,
              componentCostBreakdown,
              formula: comp.formula || 'standard'
            });
            
            // Create the component object to insert
            const componentToInsert = {
              order_id: orderResult.id,
              component_type: componentType,
              is_custom: comp.type === 'custom' || componentType === 'custom',
              size,
              color: comp.color || null,
              gsm: gsmValue,
              custom_name: customName,
              material_id: comp.material_id || null,
              roll_width: rollWidthValue,
              consumption: consumptionValue,
              component_cost: materialCost || null,
              component_cost_breakdown: componentCostBreakdown,
              formula: formula
            };
            
            // FINAL VERIFICATION: Ensure the component strictly meets database requirements
            return verifyComponent(componentToInsert);
          });

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
      
      // Success toast
      showToast({
        title: "Order Created",
        description: `Order #${orderResult.order_number} has been created successfully`,
        type: "success"
      });
      
      // Navigation is now immediate
      
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
        title: "Error creating order",
        description: error.message,
        type: "error"
      });
      
      // Error handling is now immediate
      
      return undefined;
    } finally {
      setSubmitting(false);
    }
  };

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

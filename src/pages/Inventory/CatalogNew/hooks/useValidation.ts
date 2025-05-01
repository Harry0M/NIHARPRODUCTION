
import { ProductDetails, Component, CustomComponent } from "../types";

export const useValidation = () => {
  const validateProductData = (
    productDetails: ProductDetails,
    components: Record<string, Component>,
    customComponents: CustomComponent[]
  ) => {
    const errors: string[] = [];
    
    // Required product details
    if (!productDetails.name.trim()) {
      errors.push("Product name is required");
    }
    
    if (!productDetails.bag_length) {
      errors.push("Bag length is required");
    } else if (isNaN(Number(productDetails.bag_length)) || Number(productDetails.bag_length) <= 0) {
      errors.push("Bag length must be a positive number");
    }
    
    if (!productDetails.bag_width) {
      errors.push("Bag width is required");
    } else if (isNaN(Number(productDetails.bag_width)) || Number(productDetails.bag_width) <= 0) {
      errors.push("Bag width must be a positive number");
    }
    
    if (!productDetails.height && productDetails.height !== 0) {
      errors.push("Border height is required");
    } else if (isNaN(Number(productDetails.height)) || Number(productDetails.height) < 0) {
      errors.push("Border height must be a non-negative number");
    }
    
    // Validate numeric fields
    if (productDetails.default_quantity && (isNaN(Number(productDetails.default_quantity)) || Number(productDetails.default_quantity) < 1)) {
      errors.push("Default quantity must be a positive integer");
    }
    
    if (productDetails.default_rate && (isNaN(Number(productDetails.default_rate)) || Number(productDetails.default_rate) < 0)) {
      errors.push("Default rate must be a non-negative number");
    }
    
    // Validate components
    const allComponents = [
      ...Object.values(components).filter(Boolean),
      ...customComponents
    ].filter(Boolean);
    
    // Check for custom components without names
    customComponents.forEach((comp, index) => {
      if (!comp.custom_name || comp.custom_name.trim() === '') {
        errors.push(`Custom component #${index + 1} requires a name`);
      }
    });
    
    // Check for components with invalid measurements
    allComponents.forEach(comp => {
      const componentName = comp.type === 'custom' ? (comp as CustomComponent).custom_name || 'Custom component' : comp.type;
      
      if (comp.length && (isNaN(parseFloat(comp.length as string)) || parseFloat(comp.length as string) <= 0)) {
        errors.push(`${componentName}: Length must be a positive number`);
      }
      
      if (comp.width && (isNaN(parseFloat(String(comp.width))) || parseFloat(String(comp.width)) <= 0)) {
        errors.push(`${componentName}: Width must be a positive number`);
      }
      
      if (comp.roll_width && (isNaN(parseFloat(String(comp.roll_width))) || parseFloat(String(comp.roll_width)) <= 0)) {
        errors.push(`${componentName}: Roll width must be a positive number`);
      }
    });
    
    return errors;
  };

  return { validateProductData };
};

const fieldMap = {
  selling_price: 'calculated_selling_price',
  // Add other mappings here if needed: e.g., old_field_name: 'new_field_name'
};

// Function to map payload keys to schema keys
function mapFields(payload) {
  const mappedPayload = {};
  for (const key in payload) {
    mappedPayload[fieldMap[key] || key] = payload[key];
  }
  return mappedPayload;
}

// Placeholder for type validation (can be expanded later)
function validateTypes(payload) {
  // Example: Ensure 'calculated_selling_price' is a number if present
  if (payload.hasOwnProperty('calculated_selling_price') && typeof payload.calculated_selling_price !== 'number') {
    console.warn('Type Warning: calculated_selling_price should be a number, received:', typeof payload.calculated_selling_price);
    // Optionally, throw an error or attempt conversion
  }
  // Add more type checks as needed
  return payload;
}

export function logSupabaseRequest(method, url, originalBody) {
  console.group('Supabase Request Debugging');
  console.log(`[${method}] ${url}`);
  console.log('Original Payload:', JSON.parse(JSON.stringify(originalBody)));
  
  const mappedBody = mapFields(originalBody);
  console.log('Mapped Payload (after field name correction):', JSON.parse(JSON.stringify(mappedBody)));

  const validatedBody = validateTypes(mappedBody); // Apply type validation
  console.log('Validated Payload (after type checks):', JSON.parse(JSON.stringify(validatedBody)));
  
  console.groupEnd();
  return validatedBody; // Return the processed body for the actual API call
}

export function handleSupabaseError(error) {
  console.error('Supabase Error:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    response: error.response // Full response can be helpful
  });
  return error;
}

// How to use in your API call functions:
//
// import { logSupabaseRequest, handleSupabaseError } from './debugHelper';
//
// async function updateOrder(orderId, rawPayload) {
//   const processedPayload = logSupabaseRequest('PATCH', `orders?id=eq.${orderId}`, rawPayload);
//
//   try {
//     const { data, error } = await supabase
//       .from('orders')
//       .update(processedPayload) // Use the processed payload
//       .eq('id', orderId)
//       .select(); // Optionally select to get the updated record back
//
//     if (error) {
//       throw error; // Let handleSupabaseError catch it
//     }
//     console.log('Update successful:', data);
//     return data;
//   } catch (error) {
//     return handleSupabaseError(error);
//   }
// }

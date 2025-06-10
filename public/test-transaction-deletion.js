// Test script for transaction history deletion functionality
// Run this in the browser console to test the new functions

window.testTransactionDeletion = {
  // Test getting transaction statistics
  async getStats() {
    console.log('🔍 Testing transaction history statistics...');
    try {
      const { data, error } = await window.supabase.rpc('get_transaction_history_stats');
      
      if (error) {
        console.error('❌ Error getting stats:', error);
        return;
      }
      
      console.log('✅ Transaction History Statistics:');
      console.log(`📊 Total Transaction Logs: ${data[0]?.total_transaction_logs || 0}`);
      console.log(`📊 Total Transactions: ${data[0]?.total_transactions || 0}`);
      console.log(`📊 Materials with Transactions: ${data[0]?.materials_with_transactions || 0}`);
      
      if (data[0]?.oldest_log_date && data[0]?.newest_log_date) {
        console.log(`📅 Date Range: ${new Date(data[0].oldest_log_date).toLocaleDateString()} to ${new Date(data[0].newest_log_date).toLocaleDateString()}`);
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  },

  // Test clearing all transaction history (WARNING: This will delete data!)
  async clearAll() {
    console.log('⚠️ WARNING: This will delete ALL transaction history!');
    console.log('🛑 This action cannot be undone!');
    console.log('💾 Make sure you have a backup before proceeding.');
    console.log('');
    console.log('To proceed, call: testTransactionDeletion.confirmClearAll()');
  },

  async confirmClearAll() {
    console.log('🗑️ Clearing ALL transaction history...');
    try {
      const { data, error } = await window.supabase.rpc('clear_all_transaction_history', {
        confirmation_text: 'DELETE_ALL_TRANSACTION_HISTORY'
      });
      
      if (error) {
        console.error('❌ Error clearing history:', error);
        return;
      }
      
      console.log('✅ Transaction history cleared successfully!');
      console.log(`🗑️ Deleted ${data[0]?.deleted_transaction_logs || 0} transaction logs`);
      console.log(`🗑️ Deleted ${data[0]?.deleted_transactions || 0} transactions`);
      
      return data[0];
    } catch (error) {
      console.error('❌ Clear operation failed:', error);
    }
  },

  // Test clearing by date range (safer test)
  async clearByDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      console.log('📅 Usage: testTransactionDeletion.clearByDateRange("2024-01-01", "2024-01-31")');
      return;
    }
    
    console.log(`🗑️ Clearing transaction history from ${startDate} to ${endDate}...`);
    try {
      const { data, error } = await window.supabase.rpc('clear_transaction_history_by_date', {
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        confirmation_text: 'DELETE_TRANSACTION_HISTORY_BY_DATE'
      });
      
      if (error) {
        console.error('❌ Error clearing history by date:', error);
        return;
      }
      
      console.log('✅ Transaction history cleared for date range!');
      console.log(`🗑️ Deleted ${data[0]?.deleted_transaction_logs || 0} transaction logs`);
      console.log(`🗑️ Deleted ${data[0]?.deleted_transactions || 0} transactions`);
      
      return data[0];
    } catch (error) {
      console.error('❌ Clear by date operation failed:', error);
    }
  },

  // Test clearing by material
  async clearByMaterial(materialId) {
    if (!materialId) {
      console.log('📦 Usage: testTransactionDeletion.clearByMaterial("material-uuid-here")');
      console.log('💡 You can get material IDs from the inventory table');
      return;
    }
    
    console.log(`🗑️ Clearing transaction history for material ID: ${materialId}...`);
    try {
      const { data, error } = await window.supabase.rpc('clear_transaction_history_by_material', {
        material_id: materialId,
        confirmation_text: 'DELETE_MATERIAL_TRANSACTION_HISTORY'
      });
      
      if (error) {
        console.error('❌ Error clearing history by material:', error);
        return;
      }
      
      console.log('✅ Transaction history cleared for material!');
      console.log(`🗑️ Deleted ${data[0]?.deleted_transaction_logs || 0} transaction logs`);
      console.log(`🗑️ Deleted ${data[0]?.deleted_transactions || 0} transactions`);
      
      return data[0];
    } catch (error) {
      console.error('❌ Clear by material operation failed:', error);
    }
  },

  // Get a few material IDs for testing
  async getMaterialIds(limit = 5) {
    console.log('📦 Getting material IDs for testing...');
    try {
      const { data, error } = await window.supabase
        .from('inventory')
        .select('id, material_name')
        .limit(limit);
      
      if (error) {
        console.error('❌ Error getting materials:', error);
        return;
      }
      
      console.log('📦 Available materials:');
      data.forEach((material, index) => {
        console.log(`${index + 1}. ${material.material_name} (ID: ${material.id})`);
      });
      
      return data;
    } catch (error) {
      console.error('❌ Failed to get materials:', error);
    }
  },

  // Test password validation (simulates the UI)
  testPassword(inputPassword) {
    const correctPassword = "DELETE_HISTORY_2025";
    const isValid = inputPassword === correctPassword;
    
    console.log(`🔐 Password validation test:`);
    console.log(`Input: ${inputPassword}`);
    console.log(`Valid: ${isValid ? '✅ Yes' : '❌ No'}`);
    
    if (!isValid) {
      console.log(`💡 Correct password is: ${correctPassword}`);
    }
    
    return isValid;
  }
};

// Make supabase available globally if not already
if (typeof window !== 'undefined' && !window.supabase) {
  console.log('⚠️ Supabase client not found globally. Make sure you are on a page with Supabase loaded.');
}

console.log('🧪 Transaction Deletion Test Suite Loaded!');
console.log('📋 Available commands:');
console.log('• testTransactionDeletion.getStats() - Get current transaction statistics');
console.log('• testTransactionDeletion.getMaterialIds() - Get material IDs for testing');
console.log('• testTransactionDeletion.testPassword("your-password") - Test password validation');
console.log('• testTransactionDeletion.clearByDateRange("2024-01-01", "2024-01-31") - Clear by date');
console.log('• testTransactionDeletion.clearByMaterial("material-id") - Clear by material');
console.log('• testTransactionDeletion.clearAll() - See warning about clearing all data');
console.log('');
console.log('🚀 Start with: testTransactionDeletion.getStats()');

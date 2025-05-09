
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatQuantity, calculatePercentageChange } from "@/utils/analysisUtils";
import { showToast } from "@/components/ui/enhanced-toast";

export interface MaterialConsumptionData {
  material_id: string;
  material_name: string;
  total_consumption: number;
  unit: string;
  orders_count: number;
  total_value: number;
  usage_by_order: {
    order_id: string;
    order_number: string;
    company_name: string;
    usage_quantity: number;
    usage_percentage: number;
    usage_value: number;
    component_type?: string;
  }[];
}

export interface OrderConsumptionData {
  order_id: string;
  order_number: string;
  company_name: string;
  order_date: string;
  order_quantity: number;
  catalog_id: string;
  product_name: string;
  total_production_cost: number;
  selling_rate: number;
  total_revenue: number;
  profit: number;
  profit_margin: number;
  materials: {
    material_id: string;
    material_name: string;
    quantity_used: number;
    unit: string;
    cost_per_unit: number;
    total_cost: number;
    percentage_of_total: number;
  }[];
}

export interface InventoryValueData {
  total_value: number;
  items_count: number;
  categories: {
    category: string;
    value: number;
    percentage: number;
    items: {
      material_id: string;
      material_name: string;
      quantity: number;
      unit: string;
      unit_price: number;
      total_value: number;
    }[];
  }[];
}

export const useInventoryAnalytics = () => {
  const [materialConsumptionData, setMaterialConsumptionData] = useState<MaterialConsumptionData[]>([]);
  const [orderConsumptionData, setOrderConsumptionData] = useState<OrderConsumptionData[]>([]);
  const [inventoryValueData, setInventoryValueData] = useState<InventoryValueData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch material consumption data
  const fetchMaterialConsumptionData = useCallback(async (dateRange?: { from: Date; to: Date }) => {
    try {
      setLoading(true);
      setError(null);

      // First, fetch material transactions with negative quantity (consumed materials)
      let query = supabase
        .from('inventory_transactions')
        .select(`
          id,
          material_id,
          quantity,
          transaction_type,
          created_at,
          unit_price,
          reference_id,
          reference_number,
          inventory(
            material_name,
            unit
          ),
          order:reference_id(
            id,
            order_number,
            company_name,
            component_type
          )
        `)
        .lt('quantity', 0)
        .eq('transaction_type', 'consumption');

      // Apply date filter if provided
      if (dateRange) {
        query = query
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString());
      }

      const { data: transactions, error: transactionError } = await query;

      if (transactionError) {
        throw transactionError;
      }

      if (!transactions || transactions.length === 0) {
        setMaterialConsumptionData([]);
        setLoading(false);
        return;
      }

      // Process transactions to calculate consumption by material
      const materialMap: Record<string, MaterialConsumptionData> = {};

      transactions.forEach((transaction) => {
        const materialId = transaction.material_id;
        const materialName = transaction.inventory?.material_name as string || 'Unknown Material';
        const unit = transaction.inventory?.unit as string || 'units';
        const orderId = transaction.reference_id;
        const orderNumber = transaction.reference_number;
        const companyName = transaction.order?.company_name as string || 'Unknown Company';
        const componentType = transaction.order?.component_type as string || undefined;
        const quantity = Math.abs(transaction.quantity);
        const unitPrice = transaction.unit_price || 0;
        const value = quantity * unitPrice;

        // Initialize material entry if it doesn't exist
        if (!materialMap[materialId]) {
          materialMap[materialId] = {
            material_id: materialId,
            material_name: materialName,
            total_consumption: 0,
            unit: unit,
            orders_count: 0,
            total_value: 0,
            usage_by_order: []
          };
        }

        // Update totals
        materialMap[materialId].total_consumption += quantity;
        materialMap[materialId].total_value += value;

        // Add to order-specific usage if order exists
        if (orderId) {
          // Check if order already exists in usage_by_order
          const orderIndex = materialMap[materialId].usage_by_order.findIndex(
            (o) => o.order_id === orderId
          );

          if (orderIndex >= 0) {
            // Update existing order entry
            materialMap[materialId].usage_by_order[orderIndex].usage_quantity += quantity;
            materialMap[materialId].usage_by_order[orderIndex].usage_value += value;
          } else {
            // Add new order entry
            materialMap[materialId].usage_by_order.push({
              order_id: orderId,
              order_number: orderNumber,
              company_name: companyName,
              usage_quantity: quantity,
              usage_percentage: 0, // Calculate after all data is collected
              usage_value: value,
              component_type: componentType
            });
            materialMap[materialId].orders_count += 1;
          }
        }
      });

      // Calculate percentages for each material and order
      Object.values(materialMap).forEach((material) => {
        material.usage_by_order.forEach((orderUsage) => {
          orderUsage.usage_percentage = 
            (orderUsage.usage_quantity / material.total_consumption) * 100;
        });

        // Sort usage by quantity (descending)
        material.usage_by_order.sort((a, b) => b.usage_quantity - a.usage_quantity);
      });

      // Convert map to array and sort by total consumption
      const materialConsumption = Object.values(materialMap).sort(
        (a, b) => b.total_consumption - a.total_consumption
      );

      setMaterialConsumptionData(materialConsumption);
    } catch (err: any) {
      console.error("Error fetching material consumption data:", err);
      setError(err.message || "Failed to fetch material consumption data");
      showToast({
        title: "Error loading consumption data",
        description: err.message || "An unexpected error occurred",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch order consumption data
  const fetchOrderConsumptionData = useCallback(async (dateRange?: { from: Date; to: Date }) => {
    try {
      setLoading(true);
      setError(null);

      // First, fetch orders
      let ordersQuery = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          order_date,
          company_name,
          quantity,
          catalog:product_id (
            id,
            name,
            production_cost,
            selling_rate
          )
        `)
        .order('order_date', { ascending: false });

      // Apply date filter if provided
      if (dateRange) {
        ordersQuery = ordersQuery
          .gte('order_date', dateRange.from.toISOString())
          .lte('order_date', dateRange.to.toISOString());
      }

      const { data: orders, error: ordersError } = await ordersQuery;

      if (ordersError) {
        throw ordersError;
      }

      if (!orders || orders.length === 0) {
        setOrderConsumptionData([]);
        setLoading(false);
        return;
      }

      // Fetch material consumption for these orders
      const orderIds = orders.map((order) => order.id);

      const { data: materialConsumptions, error: consumptionsError } = await supabase
        .from('inventory_transactions')
        .select(`
          id,
          material_id,
          quantity,
          unit_price,
          reference_id,
          inventory(
            material_name,
            unit
          )
        `)
        .in('reference_id', orderIds)
        .eq('transaction_type', 'consumption');

      if (consumptionsError) {
        throw consumptionsError;
      }

      // Process the data to create order consumption records
      const orderConsumptionList: OrderConsumptionData[] = [];

      for (const order of orders) {
        if (!order.catalog) continue;
        
        // Calculate order economics
        const orderQuantity = order.quantity || 0;
        const productionCost = Number(order.catalog.production_cost) || 0;
        const sellingRate = Number(order.catalog.selling_rate) || 0;
        
        const totalProductionCost = productionCost * orderQuantity;
        const totalRevenue = sellingRate * orderQuantity;
        const profit = totalRevenue - totalProductionCost;
        const profitMargin = totalProductionCost > 0 
          ? (profit / totalProductionCost) * 100 
          : 0;

        // Find material consumption for this order
        const orderMaterials = materialConsumptions
          ? materialConsumptions.filter((item) => item.reference_id === order.id)
          : [];

        // Calculate total material cost for this order
        const materialDetails = orderMaterials.map((material) => {
          const quantityUsed = Math.abs(material.quantity);
          const costPerUnit = material.unit_price || 0;
          const totalCost = quantityUsed * costPerUnit;

          return {
            material_id: material.material_id,
            material_name: material.inventory?.material_name as string || 'Unknown Material',
            quantity_used: quantityUsed,
            unit: material.inventory?.unit as string || 'units',
            cost_per_unit: costPerUnit,
            total_cost: totalCost,
            percentage_of_total: 0 // Will calculate after summing all materials
          };
        });

        // Calculate percentages
        const totalMaterialCost = materialDetails.reduce((sum, mat) => sum + mat.total_cost, 0);
        materialDetails.forEach(material => {
          material.percentage_of_total = 
            totalMaterialCost > 0 ? (material.total_cost / totalMaterialCost) * 100 : 0;
        });

        // Sort materials by total cost (descending)
        materialDetails.sort((a, b) => b.total_cost - a.total_cost);

        orderConsumptionList.push({
          order_id: order.id,
          order_number: order.order_number,
          company_name: order.company_name || 'Unknown Company',
          order_date: order.order_date,
          order_quantity: orderQuantity,
          catalog_id: order.catalog.id,
          product_name: order.catalog.name || 'Unknown Product',
          total_production_cost: totalProductionCost,
          selling_rate: sellingRate,
          total_revenue: totalRevenue,
          profit: profit,
          profit_margin: profitMargin,
          materials: materialDetails
        });
      }

      // Sort by order date (newest first)
      orderConsumptionList.sort((a, b) => 
        new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
      );

      setOrderConsumptionData(orderConsumptionList);
    } catch (err: any) {
      console.error("Error fetching order consumption data:", err);
      setError(err.message || "Failed to fetch order consumption data");
      showToast({
        title: "Error loading order data",
        description: err.message || "An unexpected error occurred",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch inventory value data
  const fetchInventoryValueData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          material_id,
          material_name,
          category,
          current_quantity,
          unit,
          purchase_price
        `)
        .gt('current_quantity', 0);

      if (inventoryError) {
        throw inventoryError;
      }

      if (!inventoryItems || inventoryItems.length === 0) {
        setInventoryValueData({
          total_value: 0,
          items_count: 0,
          categories: []
        });
        setLoading(false);
        return;
      }

      // Process inventory items by category
      const categoryMap: Record<string, {
        category: string;
        value: number;
        items: any[];
      }> = {};

      let totalInventoryValue = 0;

      inventoryItems.forEach((item) => {
        const category = item.category || 'Uncategorized';
        const quantity = Number(item.current_quantity) || 0;
        const unitPrice = Number(item.purchase_price) || 0;
        const totalValue = quantity * unitPrice;

        totalInventoryValue += totalValue;

        if (!categoryMap[category]) {
          categoryMap[category] = {
            category,
            value: 0,
            items: []
          };
        }

        categoryMap[category].value += totalValue;
        categoryMap[category].items.push({
          material_id: item.material_id,
          material_name: item.material_name,
          quantity,
          unit: item.unit,
          unit_price: unitPrice,
          total_value: totalValue
        });
      });

      // Calculate percentages and sort items within each category
      const categories = Object.values(categoryMap).map((category) => {
        // Sort items by total value (descending)
        category.items.sort((a, b) => b.total_value - a.total_value);

        return {
          category: category.category,
          value: category.value,
          percentage: (category.value / totalInventoryValue) * 100,
          items: category.items
        };
      });

      // Sort categories by total value (descending)
      categories.sort((a, b) => b.value - a.value);

      setInventoryValueData({
        total_value: totalInventoryValue,
        items_count: inventoryItems.length,
        categories
      });
    } catch (err: any) {
      console.error("Error fetching inventory value data:", err);
      setError(err.message || "Failed to fetch inventory value data");
      showToast({
        title: "Error loading inventory value data",
        description: err.message || "An unexpected error occurred",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate CSV for material consumption
  const generateMaterialConsumptionCSV = useCallback(() => {
    if (!materialConsumptionData.length) return null;

    const headers = [
      'Material ID',
      'Material Name',
      'Total Consumption',
      'Unit',
      'Orders Count',
      'Total Value (₹)',
    ].join(',');

    const rows = materialConsumptionData.map((material) => {
      return [
        material.material_id,
        `"${material.material_name}"`,
        material.total_consumption,
        material.unit,
        material.orders_count,
        material.total_value.toFixed(2)
      ].join(',');
    });

    return [headers, ...rows].join('\n');
  }, [materialConsumptionData]);

  // Generate CSV for order consumption
  const generateOrderConsumptionCSV = useCallback(() => {
    if (!orderConsumptionData.length) return null;

    const headers = [
      'Order ID',
      'Order Number',
      'Company',
      'Order Date',
      'Product',
      'Quantity',
      'Production Cost (₹)',
      'Revenue (₹)',
      'Profit (₹)',
      'Profit Margin (%)'
    ].join(',');

    const rows = orderConsumptionData.map((order) => {
      return [
        order.order_id,
        `"${order.order_number}"`,
        `"${order.company_name}"`,
        order.order_date,
        `"${order.product_name}"`,
        order.order_quantity,
        order.total_production_cost.toFixed(2),
        order.total_revenue.toFixed(2),
        order.profit.toFixed(2),
        order.profit_margin.toFixed(2)
      ].join(',');
    });

    return [headers, ...rows].join('\n');
  }, [orderConsumptionData]);

  return {
    materialConsumptionData,
    orderConsumptionData,
    inventoryValueData,
    loading,
    error,
    fetchMaterialConsumptionData,
    fetchOrderConsumptionData,
    fetchInventoryValueData,
    generateMaterialConsumptionCSV,
    generateOrderConsumptionCSV
  };
};

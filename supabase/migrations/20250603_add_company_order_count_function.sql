-- Function to count orders for each company
-- Returns a table with company details and order counts
CREATE OR REPLACE FUNCTION public.get_company_order_counts()
RETURNS TABLE (
  company_id uuid,
  company_name text,
  as_company_count bigint,
  as_sales_account_count bigint,
  total_orders bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH company_orders AS (
    SELECT 
      c.id,
      c.name,
      COUNT(o1.id) AS company_count
    FROM 
      companies c
    LEFT JOIN 
      orders o1 ON c.id = o1.company_id
    GROUP BY 
      c.id, c.name
  ),
  sales_account_orders AS (
    SELECT 
      c.id,
      c.name,
      COUNT(o2.id) AS sales_account_count
    FROM 
      companies c
    LEFT JOIN 
      orders o2 ON c.id = o2.sales_account_id
    GROUP BY 
      c.id, c.name
  )
  SELECT 
    co.id AS company_id,
    co.name AS company_name,
    co.company_count AS as_company_count,
    COALESCE(sao.sales_account_count, 0) AS as_sales_account_count,
    (co.company_count + COALESCE(sao.sales_account_count, 0)) AS total_orders
  FROM 
    company_orders co
  LEFT JOIN 
    sales_account_orders sao ON co.id = sao.id
  ORDER BY 
    total_orders DESC;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION public.get_company_order_counts() IS 'Returns a table with company details and counts of related orders, both as company and as sales account';

-- Create sales_invoices table to store invoice/sales record details
-- This is a simple table without any database triggers

CREATE TABLE sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order reference
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Invoice details
  invoice_number TEXT NOT NULL UNIQUE,
  
  -- Company and product information (stored as captured at time of invoice)
  company_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  
  -- Pricing details
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  rate DECIMAL(10,2) NOT NULL CHECK (rate >= 0),
  
  -- Transport handling
  transport_included BOOLEAN NOT NULL DEFAULT false,
  transport_charge DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (transport_charge >= 0),
  
  -- Tax and other costs
  gst_percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (gst_percentage >= 0 AND gst_percentage <= 100),
  gst_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (gst_amount >= 0),
  other_expenses DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (other_expenses >= 0),
  
  -- Calculated totals
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Additional notes (optional)
  notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX idx_sales_invoices_order_id ON sales_invoices(order_id);
CREATE INDEX idx_sales_invoices_invoice_number ON sales_invoices(invoice_number);
CREATE INDEX idx_sales_invoices_company_name ON sales_invoices(company_name);
CREATE INDEX idx_sales_invoices_created_at ON sales_invoices(created_at);

-- Enable Row Level Security
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - can be customized based on your auth requirements)
CREATE POLICY "Users can view sales invoices" ON sales_invoices
  FOR SELECT USING (true);

CREATE POLICY "Users can insert sales invoices" ON sales_invoices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own sales invoices" ON sales_invoices
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own sales invoices" ON sales_invoices
  FOR DELETE USING (created_by = auth.uid());

-- Add comment to document the table purpose
COMMENT ON TABLE sales_invoices IS 'Stores sales invoice records with all form details captured from the sells creation form. No triggers - simple data storage only.';

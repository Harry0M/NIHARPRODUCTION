
export interface OrderFormData {
  company_name: string;
  company_id: string | null;
  quantity: string;
  bag_length: string;
  bag_width: string;
  rate: string;
  special_instructions?: string;
  sales_account_id: string | null;
  order_date: string;
}

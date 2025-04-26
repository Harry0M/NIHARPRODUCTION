export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      catalog: {
        Row: {
          bag_length: number
          bag_width: number
          created_at: string
          created_by: string | null
          default_quantity: number | null
          default_rate: number | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          bag_length: number
          bag_width: number
          created_at?: string
          created_by?: string | null
          default_quantity?: number | null
          default_rate?: number | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          bag_length?: number
          bag_width?: number
          created_at?: string
          created_by?: string | null
          default_quantity?: number | null
          default_rate?: number | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalog_components: {
        Row: {
          catalog_id: string
          color: string | null
          component_type: string
          created_at: string
          custom_name: string | null
          gsm: number | null
          id: string
          size: string | null
          updated_at: string
        }
        Insert: {
          catalog_id: string
          color?: string | null
          component_type: string
          created_at?: string
          custom_name?: string | null
          gsm?: number | null
          id?: string
          size?: string | null
          updated_at?: string
        }
        Update: {
          catalog_id?: string
          color?: string | null
          component_type?: string
          created_at?: string
          custom_name?: string | null
          gsm?: number | null
          id?: string
          size?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_components_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      components: {
        Row: {
          color: string | null
          created_at: string
          details: string | null
          gsm: string | null
          id: string
          order_id: string
          size: string | null
          type: Database["public"]["Enums"]["component_type"]
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          details?: string | null
          gsm?: string | null
          id?: string
          order_id: string
          size?: string | null
          type: Database["public"]["Enums"]["component_type"]
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          details?: string | null
          gsm?: string | null
          id?: string
          order_id?: string
          size?: string | null
          type?: Database["public"]["Enums"]["component_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "components_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      cutting_components: {
        Row: {
          completed_at: string | null
          component_id: string | null
          counter: number | null
          created_at: string
          cutting_job_id: string
          height: number | null
          id: string
          material_color: string | null
          material_gsm: number | null
          material_type: string | null
          notes: string | null
          rate: number | null
          rewinding: number | null
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string
          waste_quantity: number | null
          width: number | null
        }
        Insert: {
          completed_at?: string | null
          component_id?: string | null
          counter?: number | null
          created_at?: string
          cutting_job_id: string
          height?: number | null
          id?: string
          material_color?: string | null
          material_gsm?: number | null
          material_type?: string | null
          notes?: string | null
          rate?: number | null
          rewinding?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string
          waste_quantity?: number | null
          width?: number | null
        }
        Update: {
          completed_at?: string | null
          component_id?: string | null
          counter?: number | null
          created_at?: string
          cutting_job_id?: string
          height?: number | null
          id?: string
          material_color?: string | null
          material_gsm?: number | null
          material_type?: string | null
          notes?: string | null
          rate?: number | null
          rewinding?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string
          waste_quantity?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cutting_components_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cutting_components_cutting_job_id_fkey"
            columns: ["cutting_job_id"]
            isOneToOne: false
            referencedRelation: "cutting_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      cutting_jobs: {
        Row: {
          consumption_meters: number | null
          created_at: string
          created_by: string | null
          id: string
          is_internal: boolean | null
          job_card_id: string
          received_quantity: number | null
          roll_width: number | null
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string
          worker_name: string | null
        }
        Insert: {
          consumption_meters?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_internal?: boolean | null
          job_card_id: string
          received_quantity?: number | null
          roll_width?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string
          worker_name?: string | null
        }
        Update: {
          consumption_meters?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_internal?: boolean | null
          job_card_id?: string
          received_quantity?: number | null
          roll_width?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string
          worker_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cutting_jobs_job_card_id_fkey"
            columns: ["job_card_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_batches: {
        Row: {
          batch_number: number
          created_at: string | null
          delivery_date: string
          id: string
          notes: string | null
          order_dispatch_id: string
          quantity: number
          status: string
          updated_at: string | null
        }
        Insert: {
          batch_number: number
          created_at?: string | null
          delivery_date: string
          id?: string
          notes?: string | null
          order_dispatch_id: string
          quantity: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          batch_number?: number
          created_at?: string | null
          delivery_date?: string
          id?: string
          notes?: string | null
          order_dispatch_id?: string
          quantity?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_batches_order_dispatch_id_fkey"
            columns: ["order_dispatch_id"]
            isOneToOne: false
            referencedRelation: "order_dispatches"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          gsm: string | null
          id: string
          material_type: string
          quantity: number
          reorder_level: number | null
          supplier_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          gsm?: string | null
          id?: string
          material_type: string
          quantity: number
          reorder_level?: number | null
          supplier_id?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          gsm?: string | null
          id?: string
          material_type?: string
          quantity?: number
          reorder_level?: number | null
          supplier_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      job_cards: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          job_name: string
          job_number: string | null
          order_id: string
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          job_name: string
          job_number?: string | null
          order_id: string
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          job_name?: string
          job_number?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_cards_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_components: {
        Row: {
          color: string | null
          component_type: string
          created_at: string | null
          custom_name: string | null
          gsm: number | null
          id: string
          order_id: string | null
          size: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          component_type: string
          created_at?: string | null
          custom_name?: string | null
          gsm?: number | null
          id?: string
          order_id?: string | null
          size?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          component_type?: string
          created_at?: string | null
          custom_name?: string | null
          gsm?: number | null
          id?: string
          order_id?: string | null
          size?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_components_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_dispatches: {
        Row: {
          created_at: string | null
          delivery_address: string
          delivery_date: string
          id: string
          notes: string | null
          order_id: string
          quality_checked: boolean
          quantity_checked: boolean
          recipient_name: string
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_address: string
          delivery_date: string
          id?: string
          notes?: string | null
          order_id: string
          quality_checked?: boolean
          quantity_checked?: boolean
          recipient_name: string
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_address?: string
          delivery_date?: string
          id?: string
          notes?: string | null
          order_id?: string
          quality_checked?: boolean
          quantity_checked?: boolean
          recipient_name?: string
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_dispatches_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          bag_length: number
          bag_width: number
          company_id: string | null
          company_name: string
          created_at: string
          created_by: string | null
          id: string
          order_date: string
          order_number: string
          quantity: number
          rate: number | null
          sales_account_id: string | null
          special_instructions: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          updated_at: string
        }
        Insert: {
          bag_length: number
          bag_width: number
          company_id?: string | null
          company_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          order_date?: string
          order_number: string
          quantity: number
          rate?: number | null
          sales_account_id?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string
        }
        Update: {
          bag_length?: number
          bag_width?: number
          company_id?: string | null
          company_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          order_date?: string
          order_number?: string
          quantity?: number
          rate?: number | null
          sales_account_id?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_sales_account_id_fkey"
            columns: ["sales_account_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      printing_jobs: {
        Row: {
          created_at: string
          created_by: string | null
          expected_completion_date: string | null
          gsm: string | null
          id: string
          is_internal: boolean | null
          job_card_id: string
          print_image: string | null
          pulling: string | null
          rate: number | null
          sheet_length: number | null
          sheet_width: number | null
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string
          worker_name: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expected_completion_date?: string | null
          gsm?: string | null
          id?: string
          is_internal?: boolean | null
          job_card_id: string
          print_image?: string | null
          pulling?: string | null
          rate?: number | null
          sheet_length?: number | null
          sheet_width?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string
          worker_name?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expected_completion_date?: string | null
          gsm?: string | null
          id?: string
          is_internal?: boolean | null
          job_card_id?: string
          print_image?: string | null
          pulling?: string | null
          rate?: number | null
          sheet_length?: number | null
          sheet_width?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string
          worker_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printing_jobs_job_card_id_fkey"
            columns: ["job_card_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      stitching_jobs: {
        Row: {
          border_quantity: number | null
          chain_quantity: number | null
          created_at: string
          created_by: string | null
          expected_completion_date: string | null
          handle_quantity: number | null
          id: string
          is_internal: boolean | null
          job_card_id: string
          notes: string | null
          part_quantity: number | null
          piping_quantity: number | null
          rate: number | null
          runner_quantity: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          total_quantity: number | null
          updated_at: string
          worker_name: string | null
        }
        Insert: {
          border_quantity?: number | null
          chain_quantity?: number | null
          created_at?: string
          created_by?: string | null
          expected_completion_date?: string | null
          handle_quantity?: number | null
          id?: string
          is_internal?: boolean | null
          job_card_id: string
          notes?: string | null
          part_quantity?: number | null
          piping_quantity?: number | null
          rate?: number | null
          runner_quantity?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          total_quantity?: number | null
          updated_at?: string
          worker_name?: string | null
        }
        Update: {
          border_quantity?: number | null
          chain_quantity?: number | null
          created_at?: string
          created_by?: string | null
          expected_completion_date?: string | null
          handle_quantity?: number | null
          id?: string
          is_internal?: boolean | null
          job_card_id?: string
          notes?: string | null
          part_quantity?: number | null
          piping_quantity?: number | null
          rate?: number | null
          runner_quantity?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          total_quantity?: number | null
          updated_at?: string
          worker_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stitching_jobs_job_card_id_fkey"
            columns: ["job_card_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          materials_provided: string | null
          name: string
          payment_terms: string | null
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          materials_provided?: string | null
          name: string
          payment_terms?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          materials_provided?: string | null
          name?: string
          payment_terms?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          date: string
          id: string
          notes: string | null
          order_id: string | null
          supplier_id: string | null
          type: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          supplier_id?: string | null
          type: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          supplier_id?: string | null
          type?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          payment_terms: string | null
          phone: string | null
          service_type: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          payment_terms?: string | null
          phone?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          payment_terms?: string | null
          phone?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_order_completely: {
        Args: { order_id: string }
        Returns: boolean
      }
      emergency_delete_order: {
        Args: { target_id: string }
        Returns: boolean
      }
      force_delete_order: {
        Args: { target_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      component_type:
        | "part"
        | "border"
        | "handle"
        | "chain"
        | "runner"
        | "custom"
      job_status: "pending" | "in_progress" | "completed"
      order_status:
        | "pending"
        | "in_production"
        | "cutting"
        | "printing"
        | "stitching"
        | "ready_for_dispatch"
        | "completed"
        | "cancelled"
        | "dispatched"
      user_role: "admin" | "manager" | "production" | "vendor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      component_type: ["part", "border", "handle", "chain", "runner", "custom"],
      job_status: ["pending", "in_progress", "completed"],
      order_status: [
        "pending",
        "in_production",
        "cutting",
        "printing",
        "stitching",
        "ready_for_dispatch",
        "completed",
        "cancelled",
        "dispatched",
      ],
      user_role: ["admin", "manager", "production", "vendor"],
    },
  },
} as const

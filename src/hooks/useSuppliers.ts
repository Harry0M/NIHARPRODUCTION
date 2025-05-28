
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSuppliers = () => {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });
};

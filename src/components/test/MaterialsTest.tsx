import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function MaterialsTest() {
  const [materials, setMaterials] = useState<{
    id: string;
    material_name: string;
    unit: string;
    color?: string;
    gsm?: string;
    purchase_rate?: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      console.log("MATERIALS TEST - Starting fetch...");
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from("inventory")
          .select(`
            id,
            material_name,
            unit,
            color,
            gsm,
            purchase_rate
          `)
          .order("material_name");

        console.log("MATERIALS TEST - Fetch result:", { data, error });

        if (error) {
          console.error("MATERIALS TEST - Error:", error);
          setError(error.message);
        } else {
          console.log("MATERIALS TEST - Success, materials count:", data?.length || 0);
          setMaterials(data || []);
        }
      } catch (err) {
        console.error("MATERIALS TEST - Exception:", err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  return (
    <div style={{ padding: '20px', border: '2px solid red', margin: '10px' }}>
      <h2>Materials Test Component</h2>
      <p>Loading: {loading ? 'YES' : 'NO'}</p>
      <p>Error: {error || 'NONE'}</p>
      <p>Materials Count: {materials.length}</p>
      
      {materials.length > 0 && (
        <div>
          <h3>Sample Materials:</h3>
          <ul>
            {materials.slice(0, 3).map(material => (
              <li key={material.id}>
                {material.material_name} - {material.color} - {material.unit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

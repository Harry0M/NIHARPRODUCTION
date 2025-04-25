
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CompanyNew = () => {
  const navigate = useNavigate();
  
  const handleSubmit = async (data: any) => {
    try {
      const { error } = await supabase
        .from('companies')
        .insert(data);
      
      if (error) throw error;
      
      toast({
        title: "Company created",
        description: "Company has been successfully created",
      });
      
      navigate("/companies");
    } catch (error: any) {
      toast({
        title: "Error creating company",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/companies")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Company</h1>
          <p className="text-muted-foreground">Create a new company sales account</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyNew;

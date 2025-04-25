
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const CompanyList = () => {
  const navigate = useNavigate();
  
  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Manage your company sales accounts</p>
        </div>
        <Button onClick={() => navigate("/companies/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies?.map((company) => (
          <Card key={company.id} className="cursor-pointer hover:bg-accent/5" onClick={() => navigate(`/companies/${company.id}`)}>
            <CardHeader>
              <CardTitle>{company.name}</CardTitle>
              <CardDescription>{company.contact_person}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                {company.email && (
                  <div>
                    <dt className="text-muted-foreground">Email:</dt>
                    <dd>{company.email}</dd>
                  </div>
                )}
                {company.phone && (
                  <div>
                    <dt className="text-muted-foreground">Phone:</dt>
                    <dd>{company.phone}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CompanyList;

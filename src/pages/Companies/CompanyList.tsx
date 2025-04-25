
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

interface Company {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
}

const CompanyList = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const navigate = useNavigate();

  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive"
      });
    } else {
      setCompanies(data);
    }
  };

  // Delete a company
  const handleDeleteCompany = async (companyId: string) => {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
      fetchCompanies(); // Refresh the list
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Companies</h1>
        <Button 
          onClick={() => navigate('/companies/new')}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Add Company
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell>{company.name}</TableCell>
              <TableCell>{company.contact_person || 'N/A'}</TableCell>
              <TableCell>{company.email || 'N/A'}</TableCell>
              <TableCell>{company.phone || 'N/A'}</TableCell>
              <TableCell>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteCompany(company.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CompanyList;

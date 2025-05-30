
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Update the interface to match the companies table schema
interface CompanyFormData {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  gst_number?: string; // Changed from gst to gst_number to match database schema
}

const CompanyNew = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<CompanyFormData>();
  const navigate = useNavigate();

  const onSubmit = async (data: CompanyFormData) => {
    try {
      // First, get the current user
      const { data: authData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }

      // Create a clean company data object
      const companyData = {
        name: data.name,
        contact_person: data.contact_person || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        gst_number: data.gst_number || null, // Updated field name to match database schema
        created_by: authData.user?.id // Add the current user's ID
      };

      console.log('Submitting company data:', companyData);

      // Include created_by field to track which user created the company
      const { error, data: newCompany } = await supabase
        .from('companies')
        .insert(companyData)
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Company created successfully",
      });
      navigate('/companies');
    } catch (error: any) {
      console.error('Error creating company:', error);
      let errorMessage = 'Unknown error';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      } else if (error.hint) {
        errorMessage = error.hint;
      }
      
      toast({
        title: "Error",
        description: `Failed to create company: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/companies')}
        >
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Add New Company</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Company Name *</Label>
          <Input 
            {...register('name', { required: 'Company name is required' })}
            placeholder="Enter company name"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        <div>
          <Label>Contact Person</Label>
          <Input 
            {...register('contact_person')}
            placeholder="Enter contact person name"
          />
        </div>

        <div>
          <Label>Email</Label>
          <Input 
            {...register('email', { 
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address"
              }
            })}
            placeholder="Enter email address"
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>

        <div>
          <Label>Phone</Label>
          <Input 
            {...register('phone')}
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <Label>Address</Label>
          <Input 
            {...register('address')}
            placeholder="Enter company address"
          />
        </div>

        <div>
          <Label>GST Number</Label>
          <Input 
            {...register('gst_number')} // Updated field name to match database schema
            placeholder="Enter GST registration number"
          />
        </div>

        <Button type="submit" className="w-full">
          Create Company
        </Button>
      </form>
    </div>
  );
};

export default CompanyNew;

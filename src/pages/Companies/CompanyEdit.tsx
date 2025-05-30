import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Update the interface to match the companies table schema
interface CompanyFormData {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  gst_number?: string;
}

const CompanyEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CompanyFormData>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        // Pre-populate the form with existing data
        reset({
          name: data.name,
          contact_person: data.contact_person || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          gst_number: data.gst_number || '', // TypeScript doesn't recognize this field from database
        } as CompanyFormData); // Use type assertion to handle the gst_number field
      } catch (error: any) {
        console.error('Error fetching company:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load company details',
          variant: 'destructive',
        });
        navigate('/companies');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCompany();
    }
  }, [id, reset, navigate]);

  const onSubmit = async (data: CompanyFormData) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update(data)
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Company updated successfully",
      });
      navigate(`/companies/${id}`);
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Error",
        description: `Failed to update company: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(`/companies/${id}`)}
        >
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Company</h1>
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
            {...register('gst_number')}
            placeholder="Enter GST registration number"
          />
        </div>

        <Button type="submit" className="w-full">
          Update Company
        </Button>
      </form>
    </div>
  );
};

export default CompanyEdit;

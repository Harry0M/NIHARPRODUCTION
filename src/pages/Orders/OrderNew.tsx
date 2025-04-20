
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const OrderNew = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customer: "",
    email: "",
    phone: "",
    productType: "",
    quantity: "",
    bagLength: "",
    bagWidth: "",
    color: "",
    gsm: "",
    specialInstructions: "",
    components: [
      { type: "Border", details: "" },
      { type: "Handle", details: "" },
    ]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleComponentChange = (index: number, field: string, value: string) => {
    const updatedComponents = [...formData.components];
    updatedComponents[index] = { ...updatedComponents[index], [field]: value };
    setFormData(prev => ({ ...prev, components: updatedComponents }));
  };

  const addComponent = () => {
    setFormData(prev => ({
      ...prev,
      components: [...prev.components, { type: "", details: "" }]
    }));
  };

  const removeComponent = (index: number) => {
    const updatedComponents = formData.components.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, components: updatedComponents }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form data:", formData);
    // Here you would normally send the data to your API
    // For now, we'll just simulate success and redirect
    setTimeout(() => {
      navigate("/orders");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Order</h1>
          <p className="text-muted-foreground">Create a new manufacturing order</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer Name</Label>
                  <Input
                    id="customer"
                    name="customer"
                    placeholder="Enter customer name"
                    required
                    value={formData.customer}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="customer@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productType">Product Type</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("productType", value)}
                    value={formData.productType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="canvas">Canvas Bag</SelectItem>
                      <SelectItem value="jute">Jute Bag</SelectItem>
                      <SelectItem value="cotton">Cotton Bag</SelectItem>
                      <SelectItem value="paper">Paper Bag</SelectItem>
                      <SelectItem value="nonwoven">Non-woven Bag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    required
                    value={formData.quantity}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gsm">GSM</Label>
                  <Input
                    id="gsm"
                    name="gsm"
                    placeholder="Enter GSM"
                    value={formData.gsm}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bagLength">Bag Length (cm)</Label>
                  <Input
                    id="bagLength"
                    name="bagLength"
                    type="number"
                    placeholder="Enter length"
                    required
                    value={formData.bagLength}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bagWidth">Bag Width (cm)</Label>
                  <Input
                    id="bagWidth"
                    name="bagWidth"
                    type="number"
                    placeholder="Enter width"
                    required
                    value={formData.bagWidth}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    name="color"
                    placeholder="Enter color"
                    value={formData.color}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Components</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addComponent}>
                <Plus className="mr-2 h-4 w-4" /> Add Component
              </Button>
            </CardHeader>
            <CardContent className="grid gap-6">
              {formData.components.map((component, index) => (
                <div key={index} className="space-y-4">
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Component {index + 1}</h4>
                    {index > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeComponent(index)}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`component-${index}-type`}>Type</Label>
                      <Select
                        value={component.type}
                        onValueChange={(value) => handleComponentChange(index, "type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select component type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Border">Border</SelectItem>
                          <SelectItem value="Handle">Handle</SelectItem>
                          <SelectItem value="Chain">Chain</SelectItem>
                          <SelectItem value="Runner">Runner</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`component-${index}-details`}>Details</Label>
                      <Input
                        id={`component-${index}-details`}
                        placeholder="Enter details"
                        value={component.details}
                        onChange={(e) => handleComponentChange(index, "details", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <Textarea
                  id="specialInstructions"
                  name="specialInstructions"
                  placeholder="Enter any special instructions or notes"
                  rows={3}
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => navigate("/orders")}>Cancel</Button>
            <Button type="submit">Create Order</Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OrderNew;

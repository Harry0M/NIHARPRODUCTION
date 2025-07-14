import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Plus, Trash2, Save, X } from "lucide-react";
import { Component } from "@/types/order";

interface Material {
  id: string;
  material_name: string;
  unit: string;
  color?: string;
  gsm?: string;
  purchase_rate?: number;
}

interface ComponentsEditFormProps {
  components: Component[];
  materials: Material[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdateComponents: (components: Component[]) => Promise<boolean>;
  onAddComponent: (component: Component) => Promise<boolean>;
  onDeleteComponent: (componentId: string) => Promise<boolean>;
  loading?: boolean;
  materialsLoading?: boolean;
}

export function ComponentsEditForm({
  components,
  materials,
  isEditing,
  onToggleEdit,
  onUpdateComponents,
  onAddComponent,
  onDeleteComponent,
  loading = false,
  materialsLoading = false
}: ComponentsEditFormProps) {
  const [editingComponents, setEditingComponents] = useState<Component[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newComponent, setNewComponent] = useState<Partial<Component>>({
    component_type: 'part',
    is_custom: false
  });

  const componentTypes = ['part', 'border', 'handle', 'chain', 'runner', 'custom', 'piping'];

  const startEditing = () => {
    setEditingComponents([...components]);
    onToggleEdit();
  };

  const handleCancel = () => {
    setEditingComponents([]);
    onToggleEdit();
  };

  const handleSave = async () => {
    const success = await onUpdateComponents(editingComponents);
    if (success) {
      setEditingComponents([]);
      onToggleEdit();
      // Reload the page to refresh all data
      window.location.reload();
    }
  };

  const updateComponent = (index: number, field: string, value: string | number | boolean | null) => {
    setEditingComponents(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeComponent = (index: number) => {
    setEditingComponents(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddComponent = async () => {
    if (!newComponent.component_type) return;
    
    const componentToAdd: Component = {
      id: '', // Will be set by database
      component_type: newComponent.component_type,
      is_custom: newComponent.component_type === 'custom',
      size: newComponent.size || null,
      color: newComponent.color || null,
      gsm: newComponent.gsm ? String(newComponent.gsm) : null,
      custom_name: newComponent.component_type === 'custom' ? newComponent.custom_name : null,
      material_id: newComponent.material_id || null,
      roll_width: newComponent.roll_width || null,
      consumption: newComponent.consumption || null,
      component_cost: newComponent.component_cost || null
    };

    const success = await onAddComponent(componentToAdd);
    if (success) {
      setNewComponent({
        component_type: 'part',
        is_custom: false
      });
      setShowAddDialog(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order Components</CardTitle>
          <div className="space-x-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Component
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Component</DialogTitle>
                  <DialogDescription>
                    Add a new component to this order.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="component_type">Component Type</Label>
                    <Select 
                      value={newComponent.component_type} 
                      onValueChange={(value) => setNewComponent(prev => ({ 
                        ...prev, 
                        component_type: value,
                        is_custom: value === 'custom'
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {componentTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {newComponent.component_type === 'custom' && (
                    <div>
                      <Label htmlFor="custom_name">Custom Name</Label>
                      <Input
                        id="custom_name"
                        value={newComponent.custom_name || ''}
                        onChange={(e) => setNewComponent(prev => ({ ...prev, custom_name: e.target.value }))}
                        placeholder="Enter custom component name"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="material_id">Material</Label>
                    {materials.length === 0 && !materialsLoading && (
                      <p className="text-sm text-orange-600 mb-2">
                        ⚠️ No materials available. Please add materials to the inventory first.
                      </p>
                    )}
                    <Select 
                      key={`add-material-${materials.length}`} // Force re-render when materials change
                      value={newComponent.material_id || ''} 
                      onValueChange={(value) => setNewComponent(prev => ({ ...prev, material_id: value }))}
                      disabled={materialsLoading || materials.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          materialsLoading 
                            ? "Loading materials..." 
                            : materials.length === 0 
                              ? "No materials available" 
                              : "Select material"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {materialsLoading ? (
                          <SelectItem value="loading" disabled>Loading materials...</SelectItem>
                        ) : materials.length === 0 ? (
                          <SelectItem value="no-materials" disabled>No materials available</SelectItem>
                        ) : (
                          materials.map(material => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.material_name} {material.color && `- ${material.color}`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="consumption">Consumption</Label>
                      <Input
                        id="consumption"
                        type="number"
                        step="0.01"
                        value={newComponent.consumption || ''}
                        onChange={(e) => setNewComponent(prev => ({ ...prev, consumption: parseFloat(e.target.value) }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="component_cost">Cost</Label>
                      <Input
                        id="component_cost"
                        type="number"
                        step="0.01"
                        value={newComponent.component_cost || ''}
                        onChange={(e) => setNewComponent(prev => ({ ...prev, component_cost: parseFloat(e.target.value) }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddComponent} disabled={loading}>
                    Add Component
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              onClick={startEditing}
              disabled={loading}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {components.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No components found for this order.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Consumption</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...components]
                  .sort((a, b) => {
                    const aConsumption = parseFloat(String(a.consumption || 0));
                    const bConsumption = parseFloat(String(b.consumption || 0));
                    return bConsumption - aConsumption; // Sort by consumption (highest first)
                  })
                  .map((component, index) => (
                  <TableRow key={component.id || index}>
                    <TableCell>
                      <div>
                        <span className="font-medium">
                          {component.component_type.charAt(0).toUpperCase() + component.component_type.slice(1)}
                        </span>
                        {component.custom_name && (
                          <div className="text-sm text-gray-500">{component.custom_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {component.inventory ? (
                        <div>
                          <div className="font-medium">{component.inventory.material_name}</div>
                          {component.inventory.color && (
                            <div className="text-sm text-gray-500">{component.inventory.color}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">No material</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {component.consumption ? `${component.consumption} ${component.inventory?.unit || 'units'}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(component.component_cost)}
                    </TableCell>
                    <TableCell>
                      {component.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteComponent(component.id!)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit Components</CardTitle>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {editingComponents.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No components to edit.</p>
        ) : (
          <div className="space-y-4">
            {editingComponents.map((component, index) => (
              <Card key={component.id || index} className="p-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Component Type</Label>
                    <Select 
                      value={component.component_type} 
                      onValueChange={(value) => updateComponent(index, 'component_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {componentTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {component.component_type === 'custom' && (
                    <div>
                      <Label>Custom Name</Label>
                      <Input
                        value={component.custom_name || ''}
                        onChange={(e) => updateComponent(index, 'custom_name', e.target.value)}
                        placeholder="Enter custom name"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Material</Label>
                    {materials.length === 0 && !materialsLoading && (
                      <p className="text-sm text-orange-600 mb-2">
                        ⚠️ No materials available. Please add materials to the inventory first.
                      </p>
                    )}
                    <Select 
                      key={`edit-material-${index}-${materials.length}`} // Force re-render when materials change
                      value={component.material_id || ''} 
                      onValueChange={(value) => updateComponent(index, 'material_id', value)}
                      disabled={materialsLoading || materials.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          materialsLoading 
                            ? "Loading materials..." 
                            : materials.length === 0 
                              ? "No materials available" 
                              : "Select material"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {materialsLoading ? (
                          <SelectItem value="loading" disabled>Loading materials...</SelectItem>
                        ) : materials.length === 0 ? (
                          <SelectItem value="no-materials" disabled>No materials available</SelectItem>
                        ) : (
                          materials.map(material => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.material_name} {material.color && `- ${material.color}`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Consumption</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={component.consumption || ''}
                      onChange={(e) => updateComponent(index, 'consumption', parseFloat(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={component.component_cost || ''}
                      onChange={(e) => updateComponent(index, 'component_cost', parseFloat(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeComponent(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

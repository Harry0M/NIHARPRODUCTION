
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Download, 
  Filter, 
  Plus, 
  Search,
  SortAsc
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mockOrders = [
  {
    id: "ORD-2023-056",
    customer: "Lifestyle Stores",
    product: "Canvas Shopping Bag",
    quantity: 2000,
    status: "In Production",
    date: "2023-04-15",
    value: "$4,500"
  },
  {
    id: "ORD-2023-055",
    customer: "Fashion Outlet",
    product: "Cotton Gift Bag",
    quantity: 1500,
    status: "Cutting",
    date: "2023-04-14",
    value: "$2,250"
  },
  {
    id: "ORD-2023-054",
    customer: "Green Grocer",
    product: "Jute Market Bag",
    quantity: 3000,
    status: "Printing",
    date: "2023-04-12",
    value: "$6,750"
  },
  {
    id: "ORD-2023-053",
    customer: "Bookstore Chain",
    product: "Paper Carrier Bag",
    quantity: 5000,
    status: "Ready for Dispatch",
    date: "2023-04-10",
    value: "$3,250"
  },
  {
    id: "ORD-2023-052",
    customer: "Tech Shop",
    product: "Non-woven Promotional Bag",
    quantity: 2500,
    status: "Completed",
    date: "2023-04-08",
    value: "$5,125"
  },
  {
    id: "ORD-2023-051",
    customer: "Organic Foods",
    product: "Recycled Tote Bag",
    quantity: 1800,
    status: "Completed",
    date: "2023-04-05",
    value: "$3,960"
  },
  {
    id: "ORD-2023-050",
    customer: "Clothing Brand",
    product: "Premium Gift Bag",
    quantity: 1200,
    status: "Completed",
    date: "2023-04-03",
    value: "$4,800"
  },
  {
    id: "ORD-2023-049",
    customer: "Department Store",
    product: "Luxury Paper Bag",
    quantity: 2000,
    status: "Completed",
    date: "2023-04-01",
    value: "$5,400"
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-800";
    case "Ready for Dispatch":
      return "bg-blue-100 text-blue-800";
    case "In Production":
      return "bg-yellow-100 text-yellow-800";
    case "Cutting":
    case "Printing":
    case "Stitching":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const OrderList = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrders = mockOrders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage and track all customer orders</p>
        </div>
        <Button asChild>
          <Link to="/orders/new">
            <Plus className="mr-2 h-4 w-4" /> New Order
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <SortAsc className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left font-medium">Order ID</th>
                  <th className="py-3 px-4 text-left font-medium">Customer</th>
                  <th className="py-3 px-4 text-left font-medium">Product</th>
                  <th className="py-3 px-4 text-left font-medium">Quantity</th>
                  <th className="py-3 px-4 text-left font-medium">Status</th>
                  <th className="py-3 px-4 text-left font-medium">Date</th>
                  <th className="py-3 px-4 text-left font-medium">Value</th>
                  <th className="py-3 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">
                      <Link to={`/orders/${order.id}`} className="hover:underline text-primary">
                        {order.id}
                      </Link>
                    </td>
                    <td className="py-3 px-4">{order.customer}</td>
                    <td className="py-3 px-4">{order.product}</td>
                    <td className="py-3 px-4">{order.quantity.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{order.date}</td>
                    <td className="py-3 px-4">{order.value}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/orders/${order.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No orders found matching your search.</p>
            </div>
          )}
          
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <strong>{filteredOrders.length}</strong> of <strong>{mockOrders.length}</strong> orders
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderList;

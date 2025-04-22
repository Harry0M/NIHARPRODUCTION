
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Package, Truck, Users } from "lucide-react";
import { Link } from "react-router-dom";

const statsCards = [
  {
    title: "Active Orders",
    value: "24",
    icon: Package,
    change: "+5% from last month",
    positive: true,
    linkTo: "/orders?status=in_production"
  },
  {
    title: "In Production",
    value: "18",
    icon: Layers,
    change: "+12% from last month",
    positive: true,
    linkTo: "/production"
  },
  {
    title: "Ready for Dispatch",
    value: "6",
    icon: Truck,
    change: "-2% from last month",
    positive: false,
    linkTo: "/orders?status=ready_for_dispatch"
  },
  {
    title: "Active Vendors",
    value: "12",
    icon: Users,
    change: "No change",
    positive: null,
    linkTo: "/vendors"
  }
];

// Import Layers from lucide-react
import { Layers } from "lucide-react";

const productionStages = [
  { name: "Cutting", complete: 75 },
  { name: "Printing", complete: 50 },
  { name: "Stitching", complete: 30 },
  { name: "Dispatch", complete: 10 },
];

const recentOrders = [
  {
    id: "ORD-2023-056",
    customer: "Lifestyle Stores",
    product: "Canvas Shopping Bag",
    quantity: 2000,
    status: "In Production",
    date: "2023-04-15"
  },
  {
    id: "ORD-2023-055",
    customer: "Fashion Outlet",
    product: "Cotton Gift Bag",
    quantity: 1500,
    status: "Cutting",
    date: "2023-04-14"
  },
  {
    id: "ORD-2023-054",
    customer: "Green Grocer",
    product: "Jute Market Bag",
    quantity: 3000,
    status: "Printing",
    date: "2023-04-12"
  },
  {
    id: "ORD-2023-053",
    customer: "Bookstore Chain",
    product: "Paper Carrier Bag",
    quantity: 5000,
    status: "Ready for Dispatch",
    date: "2023-04-10"
  },
  {
    id: "ORD-2023-052",
    customer: "Tech Shop",
    product: "Non-woven Promotional Bag",
    quantity: 2500,
    status: "Completed",
    date: "2023-04-08"
  }
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

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your manufacturing operations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <Link key={card.title} to={card.linkTo} className="block">
            <Card className="hover:border-primary hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className={`text-xs ${card.positive === true ? 'text-green-500' : card.positive === false ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {card.change}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Production Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productionStages.map((stage) => (
                <div key={stage.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{stage.name}</span>
                    <span className="text-sm text-muted-foreground">{stage.complete}%</span>
                  </div>
                  <Progress value={stage.complete} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Monthly Production</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[220px] flex items-center justify-center border-2 border-dashed border-muted rounded-md">
              <p className="text-muted-foreground">Production chart will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
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
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => window.location.href = `/orders/${order.id}`}
                  >
                    <td className="py-3 px-4">{order.id}</td>
                    <td className="py-3 px-4">{order.customer}</td>
                    <td className="py-3 px-4">{order.product}</td>
                    <td className="py-3 px-4">{order.quantity.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

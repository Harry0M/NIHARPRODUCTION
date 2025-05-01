import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus, Search, Edit, Eye } from "lucide-react";
import { EmptyOrdersState } from "@/components/orders/list/EmptyOrdersState";
import { Order } from "@/types/order";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";

interface OrderListFilters {
  searchQuery: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  status: string | null;
}

interface OrderFilters extends OrderListFilters {
  startDate: string | null;
  endDate: string | null;
  status: string | null;
}

interface DatePickerWithPresetsProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}

const DatePickerWithPresets: React.FC<DatePickerWithPresetsProps> = ({
  date,
  setDate,
}) => {
  const today = new Date();
  const last7Days = new Date(today.setDate(today.getDate() - 7));
  const last30Days = new Date(today.setDate(today.getDate() - 30));
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const applyPreset = (range: DateRange | undefined) => {
    setDate(range);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={"outline"}
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              `${format(date.from, "MMM dd, yyyy")} - ${format(
                date.to,
                "MMM dd, yyyy"
              )}`
            ) : (
              format(date.from, "MMM dd, yyyy")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="grid gap-2">
          <div className="flex justify-between space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyPreset(undefined)}
            >
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyPreset({ from: last7Days, to: new Date() })}
            >
              Last 7 Days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyPreset({ from: last30Days, to: new Date() })}
            >
              Last 30 Days
            </Button>
          </div>
          <div className="flex justify-between space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                applyPreset({ from: thisMonthStart, to: thisMonthEnd })
              }
            >
              This Month
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                applyPreset({ from: lastMonthStart, to: lastMonthEnd })
              }
            >
              Last Month
            </Button>
          </div>
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [status, setStatus] = useState<string | null>(null);

  const [filters, setFilters] = useState<OrderFilters>({
    searchQuery: "",
    startDate: null,
    endDate: null,
    status: null,
  });

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error: any) {
        toast({
          title: "Error fetching orders",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    setFilters({
      searchQuery: searchQuery,
      startDate: dateRange?.from?.toISOString() || null,
      endDate: dateRange?.to?.toISOString() || null,
      status: status,
    });
  }, [searchQuery, dateRange, status]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filter by status if selected
      if (filters.status && filters.status !== "" && order.status !== filters.status) {
        return false;
      }

      // Filter by date range if selected
      if (filters.startDate && filters.endDate) {
        const orderDate = new Date(order.created_at);
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        if (orderDate < startDate || orderDate > endDate) {
          return false;
        }
      }

      // Filter by search query
      if (filters.searchQuery) {
        const searchRegex = new RegExp(filters.searchQuery, "i");
        if (
          !searchRegex.test(order.order_number) &&
          !searchRegex.test(order.company_name)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [orders, filters, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isFiltering =
    searchQuery !== "" ||
    dateRange?.from !== undefined ||
    dateRange?.to !== undefined ||
    status !== null;

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Manage your orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <div className="col-span-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search orders..."
                  className="pl-8"
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            <div className="col-span-1">
              <Label htmlFor="date">Date Range</Label>
              <DatePickerWithPresets date={dateRange} setDate={setDateRange} />
            </div>

            <div className="col-span-1">
              <Label htmlFor="status">Status</Label>
              <Select value={status || ""} onValueChange={handleStatusChange}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1 flex items-end justify-end">
              <Button onClick={() => navigate("/orders/new")}>
                <Plus className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent>
          {orders.length === 0 ? (
            <EmptyOrdersState isFiltering={isFiltering} />
          ) : filteredOrders.length === 0 && orders.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No orders found</h3>
              <p className="text-muted-foreground mb-4">
                Try changing your search or filter
              </p>
            </div>
          ) : (
            <Table>
              <TableCaption>A list of your recent orders.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Order Number</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.company_name}</TableCell>
                    <TableCell>{formatDate(order.order_date)}</TableCell>
                    <TableCell>{order.quantity.toLocaleString()}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell className="text-right flex gap-2 justify-end">
                      <Link to={`/orders/${order.id}`}>
                        <Button size="sm" variant="ghost">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <Link to={`/orders/${order.id}/edit`}>
                        <Button size="sm" variant="ghost">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6}>
                    {filteredOrders.length} order(s)
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderList;

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  DollarSign,
  Users,
} from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { RecentSales } from "@/components/recent-sales";

// interface InvoiceItem {
//   description: string
//   quantity: number
//   unit_price: number
//   total: number
// }

// interface InvoiceData {
//   id: string
//   created_at: string
//   due_date: string
//   client: {
//     name: string
//     company: string
//     address: string
//     email: string
//     phone: string
//   }
//   items: InvoiceItem[]
//   subtotal: number
//   tax: number
//   total: number
//   status: string
//   notes: string
// }

export default function Dashboard() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    subscriptions: 0,
    sales: 0,
    activeNow: 0,
    monthlyRevenueData: [],
    salesByStatusData: [],
    recentSales: [],
    revenueChange: 0,
    subscriptionChange: 0,
    salesChange: 0,
    activeNowChange: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());

      if (invoicesError) throw invoicesError;

      const totalRevenue = invoices.reduce(
        (sum, invoice) => sum + invoice.total,
        0
      );
      const sales = invoices.length;

      // Calculate changes (this is a simplified example, you might want to fetch previous period data for accurate comparison)
      const revenueChange = ((totalRevenue - 10000) / 10000) * 100; // Assuming 10000 was last month's revenue
      const salesChange = ((sales - 100) / 100) * 100; // Assuming 100 was last month's sales

      const monthlyRevenueData = processMonthlyData(invoices);
      const salesByStatusData = processSalesByStatus(invoices);

      setDashboardData({
        totalRevenue,
        subscriptions: 0, // You'll need to implement this based on your data structure
        sales,
        activeNow: 573, // This is a placeholder, implement real-time user tracking for accurate data
        monthlyRevenueData,
        salesByStatusData,
        recentSales: invoices.slice(0, 5),
        revenueChange,
        subscriptionChange: 0, // You'll need to implement this
        salesChange,
        activeNowChange: 0, // You'll need to implement this
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processMonthlyData = (invoices) => {
    const monthlyData = invoices.reduce((acc, invoice) => {
      const date = new Date(invoice.created_at);
      const month = date.toLocaleString("default", { month: "short" });
      if (!acc[month]) {
        acc[month] = { revenue: 0, expenses: 0 };
      }
      acc[month].revenue += invoice.total;
      // You'll need to implement expense tracking
      return acc;
    }, {});

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
    }));
  };

  const processSalesByStatus = (invoices) => {
    const statusData = invoices.reduce((acc, invoice) => {
      if (!acc[invoice.status]) {
        acc[invoice.status] = 0;
      }
      acc[invoice.status] += invoice.total;
      return acc;
    }, {});

    return Object.entries(statusData).map(([status, total]) => ({
      status,
      total,
    }));
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  console.log(dashboardData);
  

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <CalendarDateRangePicker date={dateRange} setDate={setDateRange} />
          <Button>Download</Button>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${dashboardData.totalRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.revenueChange >= 0 ? "+" : ""}
                  {dashboardData.revenueChange.toFixed(1)}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <ArrowUpIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{dashboardData.sales}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.salesChange >= 0 ? "+" : ""}
                  {dashboardData.salesChange.toFixed(1)}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Now
                </CardTitle>
                <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  +{dashboardData.activeNow}
                </div>
                <p className="text-xs text-muted-foreground">
                  +201 since last hour
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenue",
                      color: "hsl(var(--chart-1))",
                    },
                    expenses: {
                      label: "Expenses",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.monthlyRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-revenue)"
                        name="Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke="var(--color-expenses)"
                        name="Expenses"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Sales by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    sales: {
                      label: "Sales",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.salesByStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="total"
                      >
                        {dashboardData.salesByStatusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Analytics</CardTitle>
              <CardDescription>
                Detailed breakdown of sales performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  sales: {
                    label: "Sales",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      fill="var(--color-revenue)"
                      name="Revenue"
                    />
                    <Bar
                      dataKey="expenses"
                      fill="var(--color-expenses)"
                      name="Expenses"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Download financial reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Monthly Financial Report</span>
                <Button size="sm">Download</Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Quarterly Sales Analysis</span>
                <Button size="sm">Download</Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Annual Revenue Summary</span>
                <Button size="sm">Download</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 md:space-x-4">
        <Link href="/invoices">
          <Button className="w-full md:w-auto">Manage Invoices</Button>
        </Link>
        <Link href="/invoices/new">
          <Button variant="outline" className="w-full md:w-auto">
            Generate New Invoice
          </Button>
        </Link>
      </div>
    </div>
  );
}

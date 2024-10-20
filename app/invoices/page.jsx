"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
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
import { Input } from "@/components/ui/input";
import { PlusCircle, Eye, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabaseClient";
import * as XLSX from "xlsx";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [invoiceData, setInvoiceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const companyName = "TechInvoice Solutions";
  const companyAddress = "123 Tech Street, Silicon Valley, CA 94000";
  const companyPhone = "+1 (555) 123-4567";
  const companyEmail = "contact@techinvoice.com";
  const companyWebsite = "www.techinvoice.com";

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [statusFilter, searchTerm, invoices]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `*,
          client: clients (
            name,
            company,
            address,
            email,
            phone
          ),
          invoice_items (
            description,
            quantity,
            unit_price,
            total,
            is_free
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInvoices(data || []);
      setInvoiceData(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // console.log(invoiceData);

  const filterInvoices = () => {
    let filtered = invoices;

    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  };

  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: newStatus })
        .eq("id", invoiceId);

      if (error) throw error;

      setInvoices(
        invoices.map((invoice) =>
          invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
        )
      );

      toast({
        title: "Status Updated",
        description: `Invoice status has been updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating invoice status:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTotalPendingAmount = () => {
    return invoices
      .filter((invoice) => invoice.status === "pending")
      .reduce((total, invoice) => total + invoice.total, 0);
  };

  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDownload = (invoiceData) => {
    if (!invoiceData) return;

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([]);

    // Company Information (Header)
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ["Company Name:", companyName],
        ["Company Address:", companyAddress],
        ["Company Phone:", companyPhone],
        ["Company Email:", companyEmail],
        ["Company Website:", companyWebsite],
      ],
      { origin: "A1" }
    );

    // Add a blank row
    XLSX.utils.sheet_add_aoa(worksheet, [[]], { origin: -1 });

    // Invoice Information
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ["Invoice ID:", invoiceData.id],
        ["Date:", new Date(invoiceData.created_at).toLocaleDateString()],
        ["Due Date:", new Date(invoiceData.due_date).toLocaleDateString()],
        ["Status:", invoiceData.status],
      ],
      { origin: -1 }
    );

    // Add a blank row
    XLSX.utils.sheet_add_aoa(worksheet, [[]], { origin: -1 });

    // Client Information
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ["Client Name:", invoiceData?.client.name],
        ["Client Company:", invoiceData.client.company],
        ["Client Address:", invoiceData.client.address],
        ["Client Email:", invoiceData.client.email],
        ["Client Phone:", invoiceData.client.phone],
      ],
      { origin: -1 }
    );

    // Add a blank row
    XLSX.utils.sheet_add_aoa(worksheet, [[]], { origin: -1 });

    // Invoice Items (Headers)
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [["Description", "Quantity", "Unit Price", "Free", "Total"]],
      { origin: -1 }
    );

    // Invoice Items (Data)
    invoiceData.invoice_items.forEach((item) => {
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [
            item.description,
            item.quantity,
            item.unit_price.toFixed(2),
            item.is_free ? "Free" : "",
            `$${item.total.toFixed(2)}`,
          ],
        ],
        { origin: -1 }
      );
    });

    // Add a blank row
    XLSX.utils.sheet_add_aoa(worksheet, [[]], { origin: -1 });

    // Subtotal, Discount, Tax, Total
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ["", "", "Subtotal:", `$${invoiceData.subtotal.toFixed(2)}`],
        ["", "", "Discount:", `$${invoiceData.discount.toFixed(2)}`],
        [
          "",
          "",
          `Tax (${invoiceData.tax_rate}%):`,
          `$${invoiceData.tax.toFixed(2)}`,
        ],
        ["", "", "Total:", `$${invoiceData.total.toFixed(2)}`],
      ],
      { origin: -1 }
    );

    // Add a blank row
    XLSX.utils.sheet_add_aoa(worksheet, [[]], { origin: -1 });

    // Notes
    XLSX.utils.sheet_add_aoa(worksheet, [["Notes:"], [invoiceData.notes]], {
      origin: -1,
    });

    // Append the worksheet to the workbook and save the file
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice");
    XLSX.writeFile(workbook, `Invoice_${invoiceData.id}.xlsx`);

    toast({
      title: "Invoice Downloaded",
      description: "The invoice has been downloaded successfully.",
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Invoices</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Total Pending: ${getTotalPendingAmount().toFixed(2)}(
              {
                invoices.filter((invoice) => invoice.status === "pending")
                  .length
              }{" "}
              invoices)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search by client or invoice ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Link href="/invoices/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Invoice
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-4">No invoices found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Remaining</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.id}</TableCell>
                    <TableCell>
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getDaysRemaining(invoice.due_date)}</TableCell>
                    <TableCell>
                      <div>{invoice.client.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.client.email}
                      </div>
                    </TableCell>
                    <TableCell>${invoice.total}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          invoice.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : invoice.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link href={`/invoices/${invoice.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(invoice)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Select
                          value={invoice.status}
                          onValueChange={(value) =>
                            updateInvoiceStatus(invoice.id, value)
                          }
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

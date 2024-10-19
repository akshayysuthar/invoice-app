"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DownloadIcon, PrinterIcon } from "lucide-react";
import * as XLSX from "xlsx";
import { useSession } from "next-auth/react";
import { supabase } from "@/utils/supabaseClient";

const companyName = "TechInvoice Solutions";
const companyAddress = "123 Tech Street, Silicon Valley, CA 94000";
const companyPhone = "+1 (555) 123-4567";
const companyEmail = "contact@techinvoice.com";
const companyWebsite = "www.techinvoice.com";
const companyLogo =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-placeholder-Wd7kZjjmXZZjqZXXPZZXZZZZZZZZZZZZ.png";

export default function InvoicePage() {
  const { id } = useParams();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [invoiceData, setInvoiceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchInvoiceData();
    setIsAdmin(session?.user?.role === "admin");
  }, [id, session]);

  const fetchInvoiceData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `*,
          clients (
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
            total
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      setInvoiceData(data);
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch invoice data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  console.log(invoiceData);

  const handleDownload = () => {
    if (!invoiceData) return;

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([
      { "Company Name": companyName },
      { "Company Address": companyAddress },
      { "Company Phone": companyPhone },
      { "Company Email": companyEmail },
      { "Company Website": companyWebsite },
      {},
      { "Invoice ID": invoiceData.id },
      { Date: new Date(invoiceData.created_at).toLocaleDateString() },
      { "Due Date": new Date(invoiceData.due_date).toLocaleDateString() },
      { Status: invoiceData.status },
      {},
      { "Client Name": invoiceData.client.name },
      { "Client Company": invoiceData.client.company },
      { "Client Address": invoiceData.client.address },
      { "Client Email": invoiceData.client.email },
      { "Client Phone": invoiceData.client.phone },
      {},
      { Description: "Quantity", "": "Unit Price", "  ": "Total" },
      ...invoiceData.items.map((item) => ({
        Description: item.description,
        "": item.quantity,
        " ": `$${item.unit_price.toFixed(2)}`,
        "  ": `$${item.total.toFixed(2)}`,
      })),
      {},
      { "": "", " ": "Subtotal:", "  ": `$${invoiceData.subtotal.toFixed(2)}` },
      { "": "", " ": "Tax:", "  ": `$${invoiceData.tax.toFixed(2)}` },
      { "": "", " ": "Total:", "  ": `$${invoiceData.total.toFixed(2)}` },
      {},
      { Notes: invoiceData.notes },
    ]);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice");
    XLSX.writeFile(workbook, `Invoice_${invoiceData.id}.xlsx`);

    toast({
      title: "Invoice Downloaded",
      description: "The invoice has been downloaded successfully.",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading invoice data...</div>;
  }

  if (!invoiceData) {
    return <div className="text-center p-4">Invoice not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">
              Invoice #{invoiceData.id}
            </CardTitle>
            <div>
              {isAdmin && (
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={handlePrint}
                >
                  <PrinterIcon className="mr-2 h-4 w-4" />
                  Print
                </Button>
              )}
              <Button onClick={handleDownload}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex justify-between">
              <div>
                <img
                  src={companyLogo}
                  alt="Company Logo"
                  className="h-12 mb-2"
                />
                <h2 className="text-2xl font-bold">{companyName}</h2>
                <p>{companyAddress}</p>
                <p>{companyPhone}</p>
                <p>{companyEmail}</p>
                <p>{companyWebsite}</p>
              </div>
              <div className="text-right">
                <h1 className="text-4xl font-bold mb-4">INVOICE</h1>
                <p>
                  <strong>Invoice #:</strong> {invoiceData.id}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(invoiceData.created_at).toLocaleDateString()}
                </p>
                <p>
                  <strong>Due Date:</strong>{" "}
                  {new Date(invoiceData.due_date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Status:</strong> {invoiceData.status}
                </p>
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-2">Bill To:</h3>
              <p>{invoiceData.clients.name}</p>
              <p>{invoiceData.clients.company}</p>
              <p>{invoiceData.clients.address}</p>
              <p>{invoiceData.clients.email}</p>
              <p>{invoiceData.clients.phone}</p>
            </div>
            <table className="w-full mt-8">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Description</th>
                  <th className="text-right p-2">Quantity</th>
                  <th className="text-right p-2">Unit Price</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.invoice_items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="text-left p-2">{item.description}</td>
                    <td className="text-right p-2">{item.quantity}</td>
                    <td className="text-right p-2">
                      ${item.unit_price.toFixed(2)}
                    </td>
                    <td className="text-right p-2">${item.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-right p-2">
                    <strong>Subtotal:</strong>
                  </td>
                  <td className="text-right p-2">${invoiceData.subtotal}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right p-2">
                    <strong>Discount:</strong> 
                  </td>
                  <td className="text-right p-2">- ${invoiceData.discount}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right p-2">
                    <strong>Tax:</strong>
                  </td>
                  <td className="text-right p-2">${invoiceData.tax}</td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={3} className="text-right p-2">
                    <strong>Total:</strong>
                  </td>
                  <td className="text-right p-2">${invoiceData.total}</td>
                </tr>
              </tfoot>
            </table>
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-2">Notes:</h3>
              <p>{invoiceData.notes}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

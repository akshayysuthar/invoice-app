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
import logo from "@/public/logo.svg";
import Image from "next/image";

const companyName = "TechInvoice Solutions";
const companyAddress = "123 Tech Street, Silicon Valley, CA 94000";
const companyPhone = "+1 (555) 123-4567";
const companyEmail = "contact@techinvoice.com";
const companyWebsite = "www.techinvoice.com";


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
            total,
            is_free
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

  const handleDownload = () => {
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
        ["Client Name:", invoiceData.clients.name],
        ["Client Company:", invoiceData.clients.company],
        ["Client Address:", invoiceData.clients.address],
        ["Client Email:", invoiceData.clients.email],
        ["Client Phone:", invoiceData.clients.phone],
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
                <Image src={logo} alt="Company Logo" className="h-12 mb-2" />
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
                    <td className="text-right p-2">
                      {item.is_free ? "Free" : `$${item.total.toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-right p-2">
                    <strong>Subtotal:</strong>
                  </td>
                  <td className="text-right p-2">
                    ${invoiceData.subtotal.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right p-2">
                    <strong>Discount:</strong>
                  </td>
                  <td className="text-right p-2">
                    - ${invoiceData.discount.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right p-2">
                    <strong>Tax ({invoiceData.tax_rate}%):</strong>
                  </td>
                  <td className="text-right p-2">
                    ${invoiceData.tax.toFixed(2)}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={3} className="text-right p-2">
                    <strong>Total:</strong>
                  </td>
                  <td className="text-right p-2">
                    ${invoiceData.total.toFixed(2)}
                  </td>
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

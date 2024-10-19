"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Eye, Download, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/utils/supabaseClient"

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchInvoices()
  }, [])

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredInvoices(invoices)
    } else {
      setFilteredInvoices(invoices.filter(invoice => invoice.status === statusFilter))
    }
  }, [statusFilter, invoices])

  const fetchInvoices = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          created_at,
          due_date,
          subtotal,
          tax,
          total,
          status,
          notes,
          client:clients (
            name,
            company,
            address,
            email,
            phone
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setInvoices(data || [])
    } catch (error) {
      console.error("Error fetching invoices:", error)
      toast({
        title: "Error",
        description: "Failed to fetch invoices. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: newStatus })
        .eq("id", invoiceId)

      if (error) throw error

      setInvoices(invoices.map(invoice => 
        invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
      ))

      toast({
        title: "Status Updated",
        description: `Invoice status has been updated to ${newStatus}.`,
      })
    } catch (error) {
      console.error("Error updating invoice status:", error)
      toast({
        title: "Error",
        description: "Failed to update invoice status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getTotalPendingAmount = () => {
    return invoices
      .filter(invoice => invoice.status === "pending")
      .reduce((total, invoice) => total + invoice.total, 0)
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Invoices</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Total Pending: ${getTotalPendingAmount().toFixed(2)} 
              ({invoices.filter(invoice => invoice.status === "pending").length} invoices)
            </p>
          </div>
          <div className="flex items-center space-x-2">
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
                    <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div>{invoice.client.name}</div>
                      <div className="text-sm text-muted-foreground">{invoice.client.email}</div>
                    </TableCell>
                    <TableCell>${invoice.total}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        invoice.status === "paid" ? "bg-green-100 text-green-800" :
                        invoice.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
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
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Select 
                          value={invoice.status} 
                          onValueChange={(value) => updateInvoiceStatus(invoice.id, value)}
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
  )
}
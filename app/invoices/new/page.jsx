"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2 } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";


const TAX_RATE = 0.1;
const PREDEFINED_PLANS = [
  { name: "Basic Web Design", price: 299 },
  { name: "Standard Web Design", price: 459 },
  { name: "Premium Web Design", price: 799 },
  { name: "Enterprise Web Design", price: null },
  { name: "Domain Registration", price: 15 },
  { name: "Web Hosting (Monthly)", price: 20 },
  { name: "Web Hosting (Yearly)", price: 200 },
  { name: "Basic Maintenance", price: 50 },
  { name: "Standard Maintenance", price: 100 },
  { name: "Premium Maintenance", price: 200 },
];

// interface Client {
//   id: string
//   name: string
//   company: string
//   address: string
//   email: string
//   phone: string
// }

// interface InvoiceItem {
//   description: string
//   quantity: number
//   unit_price: number
// }

export default function NewInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [clients, setClients] = useState([]);
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    company: "",
    address: "",
    email: "",
    phone: "",
  });
  const [invoiceData, setInvoiceData] = useState({
    client_id: "",
    created_at: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    items: [{ description: "", quantity: 1, unit_price: 0 }],
    notes: "",
    discount_type: "none",
    discount_value: 0,
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase.from("clients").select("*");
    if (error) {
      console.error("Error fetching clients:", error);
    } else {
      setClients(data);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData({ ...invoiceData, [name]: value });
  };

  const handleClientChange = (value) => {
    setInvoiceData({ ...invoiceData, client_id: value });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoiceData.items];
    updatedItems[index][field] = value;
    setInvoiceData({ ...invoiceData, items: updatedItems });
  };

  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [
        ...invoiceData.items,
        { description: "", quantity: 1, unit_price: 0 },
      ],
    });
  };

  const removeItem = (index) => {
    const updatedItems = invoiceData.items.filter((_, i) => i !== index);
    setInvoiceData({ ...invoiceData, items: updatedItems });
  };

  const calculateSubtotal = () => {
    return invoiceData.items.reduce(
      (total, item) => total + item.quantity * item.unit_price,
      0
    );
  };

  const calculateDiscount = (subtotal) => {
    if (invoiceData.discount_type === "percentage") {
      return subtotal * (invoiceData.discount_value / 100);
    } else if (invoiceData.discount_type === "fixed") {
      return invoiceData.discount_value;
    }
    return 0;
  };

  const calculateTax = (subtotal) => {
    return subtotal * TAX_RATE;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount(subtotal);
    const tax = calculateTax(subtotal - discount);
    return subtotal - discount + tax;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const subtotal = calculateSubtotal();
      const discount = calculateDiscount(subtotal);
      const tax = calculateTax(subtotal - discount);
      const total = subtotal - discount + tax;

      let client_id = invoiceData.client_id;

      if (isNewClient) {
        const { data, error } = await supabase
          .from("clients")
          .insert([newClient])
          .select();

        if (error) throw error;
        client_id = data[0].id;
      }

      const { data, error } = await supabase
        .from("invoices")
        .insert([
          {
            client_id,
            created_at: invoiceData.created_at,
            due_date: invoiceData.due_date,
            subtotal,
            discount,
            tax,
            total,
            status: "pending",
            notes: invoiceData.notes,
            discount_type: invoiceData.discount_type,
            discount_value: invoiceData.discount_value,
          },
        ])
        .select();

      if (error) throw error;

      const invoice_id = data[0].id;

      const { error: itemsError } = await supabase.from("invoice_items").insert(
        invoiceData.items.map((item) => ({
          invoice_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }))
      );

      if (itemsError) throw itemsError;

      toast({
        title: "Invoice Created",
        description: "Your invoice has been successfully created.",
      });

      router.push("/invoices");
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description:
          "There was an error creating the invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Create New Invoice
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isNewClient"
                  checked={isNewClient}
                  onCheckedChange={(checked) => setIsNewClient(checked)}
                />
                <Label htmlFor="isNewClient">New Client</Label>
              </div>
              {isNewClient ? (
                <div className="space-y-4">
                  <Input
                    placeholder="Client Name"
                    value={newClient.name}
                    onChange={(e) =>
                      setNewClient({ ...newClient, name: e.target.value })
                    }
                    required
                  />
                  <Input
                    placeholder="Company"
                    value={newClient.company}
                    onChange={(e) =>
                      setNewClient({ ...newClient, company: e.target.value })
                    }
                  />
                  <Textarea
                    placeholder="Address"
                    value={newClient.address}
                    onChange={(e) =>
                      setNewClient({ ...newClient, address: e.target.value })
                    }
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={newClient.email}
                    onChange={(e) =>
                      setNewClient({ ...newClient, email: e.target.value })
                    }
                    required
                  />
                  <Input
                    placeholder="Phone"
                    value={newClient.phone}
                    onChange={(e) =>
                      setNewClient({ ...newClient, phone: e.target.value })
                    }
                  />
                </div>
              ) : (
                <Select
                  onValueChange={handleClientChange}
                  value={invoiceData.client_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="createdAt">Invoice Date</Label>
                  <Input
                    id="createdAt"
                    name="created_at"
                    type="date"
                    value={invoiceData.created_at}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    name="due_date"
                    type="date"
                    value={invoiceData.due_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Label>Invoice Items</Label>
              {invoiceData.items.map((item, index) => (
                <div key={index} className="flex flex-wrap items-end gap-4">
                  <div className="flex-grow space-y-2">
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Select
                      onValueChange={(value) => {
                        const plan = PREDEFINED_PLANS.find(
                          (p) => p.name === value
                        );
                        handleItemChange(index, "description", value);
                        if (plan && plan.price) {
                          handleItemChange(index, "unit_price", plan.price);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service or enter custom" />
                      </SelectTrigger>
                      <SelectContent>
                        {PREDEFINED_PLANS.map((plan) => (
                          <SelectItem key={plan.name} value={plan.name}>
                            {plan.name}{" "}
                            {plan.price ? `($${plan.price})` : "(Custom)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {item.description === "Enterprise Web Design" && (
                      <Input
                        placeholder="Enter custom description"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                        className="mt-2"
                      />
                    )}
                  </div>
                  <div className="w-24 space-y-2">
                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          parseInt(e.target.value)
                        )
                      }
                      required
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label htmlFor={`price-${index}`}>Unit Price</Label>
                    <Input
                      id={`price-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "unit_price",
                          parseFloat(e.target.value)
                        )
                      }
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>
            <div className="space-y-4">
              <Label>Discount</Label>
              <Select
                value={invoiceData.discount_type}
                onValueChange={(value) =>
                  setInvoiceData({ ...invoiceData, discount_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Discount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
              {invoiceData.discount_type !== "none" && (
                <Input
                  type="number"
                  min="0"
                  step={
                    invoiceData.discount_type === "percentage" ? "1" : "0.01"
                  }
                  value={invoiceData.discount_value}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      discount_value: parseFloat(e.target.value),
                    })
                  }
                  placeholder={
                    invoiceData.discount_type === "percentage"
                      ? "Discount percentage"
                      : "Discount amount"
                  }
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={invoiceData.notes}
                onChange={handleInputChange}
                placeholder="Add any additional notes here..."
              />
            </div>
            <div className="space-y-2 text-right">
              <p className="text-lg">
                Subtotal: ${calculateSubtotal().toFixed(2)}
              </p>
              {invoiceData.discount_type !== "none" && (
                <p className="text-lg">
                  Discount: ${calculateDiscount(calculateSubtotal()).toFixed(2)}
                </p>
              )}
              <p className="text-lg">
                Tax (10%): $
                {calculateTax(
                  calculateSubtotal() - calculateDiscount(calculateSubtotal())
                ).toFixed(2)}
              </p>
              <p className="text-lg font-semibold">
                Total: ${calculateTotal().toFixed(2)}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Create Invoice
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

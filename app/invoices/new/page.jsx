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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2 } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { useSession } from "next-auth/react";

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

const DISCOUNT_OPTIONS = [
  { label: "No Discount", value: "none" },
  { label: "10% Off", value: "percentage_10" },
  { label: "5% Off", value: "percentage_5" },
  { label: "First Order 25% Off", value: "percentage_25_first" },
  { label: "Custom", value: "custom" },
];

export default function NewInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [clients, setClients] = useState([]);
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    company: "",
    address: "",
    email: "",
    phone: "",
  });
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [invoiceData, setInvoiceData] = useState({
    client_id: "",
    created_at: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    items: [
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        is_free: false,
        total: 0,
      },
    ],
    notes: "",
    discount_type: "none",
    discount_value: 0,
    tax_rate: 10,
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

  const handleClientSearch = (e) => {
    setClientSearch(e.target.value);
    const foundClient = clients.find(
      (client) =>
        client.name.toLowerCase().includes(e.target.value.toLowerCase()) ||
        client.email.toLowerCase().includes(e.target.value.toLowerCase())
    );
    if (foundClient) {
      setSelectedClient(foundClient);
      setInvoiceData({ ...invoiceData, client_id: foundClient.id });
    } else {
      setSelectedClient(null);
      setInvoiceData({ ...invoiceData, client_id: "" });
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoiceData.items];
    updatedItems[index][field] = value;

    // Recalculate the total for the item
    updatedItems[index].total = calculateItemTotal(updatedItems[index]);

    setInvoiceData({ ...invoiceData, items: updatedItems });
  };

  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [
        ...invoiceData.items,
        {
          description: "",
          quantity: 1,
          unit_price: 0,
          is_free: false,
          total: 0,
        },
      ],
    });
  };

  const removeItem = (index) => {
    const updatedItems = invoiceData.items.filter((_, i) => i !== index);
    setInvoiceData({ ...invoiceData, items: updatedItems });
  };

  const calculateSubtotal = () => {
    return invoiceData.items.reduce((total, item) => total + item.total, 0);
  };

  const calculateItemTotal = (item) => {
    return item.is_free ? 0 : item.quantity * item.unit_price;
  };

  const calculateDiscount = (subtotal) => {
    switch (invoiceData.discount_type) {
      case "percentage_10":
        return subtotal * 0.1;
      case "percentage_5":
        return subtotal * 0.05;
      case "percentage_25_first":
        return subtotal * 0.25;
      case "custom":
        return invoiceData.discount_value;
      default:
        return 0;
    }
  };

  const calculateTax = (subtotal) => {
    return (
      (subtotal - calculateDiscount(subtotal)) * (invoiceData.tax_rate / 100)
    );
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount(subtotal);
    const tax = calculateTax(subtotal);
    return subtotal - discount + tax;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create an invoice.",
        variant: "destructive",
      });
      return;
    }

    try {
      const subtotal = calculateSubtotal();
      const discount = calculateDiscount(subtotal);
      const tax = calculateTax(subtotal);
      const total = calculateTotal();

      let client_id = invoiceData.client_id;

      if (isNewClient) {
        const { data, error } = await supabase
          .from("clients")
          .insert([newClient])
          .select();

        if (error) throw error;
        client_id = data[0].id;
        setSelectedClient(data[0]);
        toast({
          title: "New Client Created",
          description: "The new client has been successfully added.",
        });
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
            tax_rate: invoiceData.tax_rate,
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
          is_free: item.is_free,
          total: item.total,
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
            {/* Client selection and new client form */}
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
                <div className="space-y-2">
                  <Label htmlFor="clientSearch">Search Client</Label>
                  <Input
                    id="clientSearch"
                    placeholder="Search by name or email"
                    value={clientSearch}
                    onChange={handleClientSearch}
                  />
                  {selectedClient && (
                    <div className="mt-2 p-2 bg-secondary rounded">
                      <p>
                        <strong>Selected Client</strong>
                      </p>
                      <p>{selectedClient.name}</p>
                      <p>{selectedClient.email}</p>
                    </div>
                  )}
                  {!selectedClient && clientSearch && (
                    <p className="text-sm text-muted-foreground mt-2">
                      No client found. Consider adding a new client.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Invoice items */}
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
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`free-${index}`}
                      checked={item.is_free}
                      onCheckedChange={(checked) =>
                        handleItemChange(index, "is_free", checked)
                      }
                    />
                    <Label htmlFor={`free-${index}`}>Free Service</Label>
                  </div>
                  <div className="w-32  space-y-2">
                    <Label>Item Total</Label>
                    <Input
                      type="text"
                      value={
                        item.is_free ? "Free" : `$${item.total.toFixed(2)}`
                      }
                      readOnly
                      className="bg-muted"
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

            {/* Discount */}
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
                  {DISCOUNT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {invoiceData.discount_type === "custom" && (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoiceData.discount_value}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      discount_value: parseFloat(e.target.value),
                    })
                  }
                  placeholder="Enter custom discount amount"
                />
              )}
            </div>

            {/* Tax Rate */}
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                name="tax_rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={invoiceData.tax_rate}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Notes */}
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

            {/* Invoice Summary */}
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
                Tax ({invoiceData.tax_rate}%): $
                {calculateTax(calculateSubtotal()).toFixed(2)}
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

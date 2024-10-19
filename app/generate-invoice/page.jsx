"use client";
import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/utils/supabaseClient";

const GenerateInvoice = () => {
  const { data: session } = useSession();
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [plan, setPlan] = useState("basic");
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) return;

    const { data, error } = await supabase.from("invoices").insert([
      {
        client_name: clientName,
        client_email: clientEmail,
        plan: plan,
        total_amount: parseFloat(amount),
        created_by: session.user.name,
      },
    ]);

    if (error) {
      console.error("Error creating invoice:", error);
    } else {
      console.log("Invoice created successfully:", data);
      // Reset form or redirect to invoice list
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Button onClick={() => signIn("github")} size="lg">
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate New Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="clientName"
                className="block text-sm font-medium text-gray-700"
              >
                Client Name
              </label>
              <Input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="clientEmail"
                className="block text-sm font-medium text-gray-700"
              >
                Client Email
              </label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="plan"
                className="block text-sm font-medium text-gray-700"
              >
                Plan
              </label>
              <Select
                id="plan"
                value={plan}
                onValueChange={(value) => setPlan(value)}
              >
                <Select.Option value="basic">Basic</Select.Option>
                <Select.Option value="standard">Standard</Select.Option>
                <Select.Option value="premium">Premium</Select.Option>
                <Select.Option value="enterprise">Enterprise</Select.Option>
              </Select>
            </div>
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700"
              >
                Amount
              </label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <Button type="submit">Generate Invoice</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateInvoice;

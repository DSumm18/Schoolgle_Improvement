"use client";

/**
 * New Contractor Page
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function NewContractorPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const services = Array.from(formData.entries())
      .filter(([key]) => key.startsWith("service-"))
      .map(([key]) => key.replace("service-", ""));

    const data = {
      company_name: formData.get("company_name"),
      contact_name: formData.get("contact_name"),
      contact_email: formData.get("contact_email"),
      contact_phone: formData.get("contact_phone"),
      address: formData.get("address"),
      is_preferred: formData.get("is_preferred") === "on",
      services,
      status: formData.get("status") || "active",
    };

    try {
      const response = await fetch("/api/estates/contractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create contractor");
      }

      router.push("/estates-compliance/contractors");
    } catch (error) {
      console.error("Error creating contractor:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create contractor",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/estates-compliance/contractors"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Contractors
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Add New Contractor
        </h1>
        <p className="text-muted-foreground mt-1">
          Register a new contractor in the compliance system
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border bg-card p-6 shadow-sm"
      >
        {/* Company Name */}
        <div className="space-y-2">
          <Label htmlFor="company_name">
            Company Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="company_name"
            name="company_name"
            type="text"
            required
            placeholder="e.g., ABC Safety Services Ltd"
          />
        </div>

        {/* Contact Name */}
        <div className="space-y-2">
          <Label htmlFor="contact_name">
            Contact Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact_name"
            name="contact_name"
            type="text"
            required
            placeholder="e.g., John Smith"
          />
        </div>

        {/* Contact Email & Phone */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact_email">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              required
              placeholder="contact@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Phone Number</Label>
            <Input
              id="contact_phone"
              name="contact_phone"
              type="tel"
              placeholder="+44 123 456 7890"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            name="address"
            rows={3}
            placeholder="Full business address"
          />
        </div>

        {/* Services */}
        <div className="space-y-2">
          <Label>Services Provided</Label>
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            {[
              { value: "legionella", label: "Legionella Control" },
              { value: "fire", label: "Fire Safety" },
              { value: "electrical", label: "Electrical Testing" },
              { value: "gas", label: "Gas Safety" },
              { value: "asbestos", label: "Asbestos Management" },
              { value: "lift", label: "Lift Maintenance" },
              { value: "playground", label: "Playground Inspection" },
              { value: "water", label: "Water Quality Testing" },
            ].map((service) => (
              <div key={service.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`service-${service.value}`}
                  name={`service-${service.value}`}
                />
                <Label
                  htmlFor={`service-${service.value}`}
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {service.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue="active">
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preferred */}
        <div className="flex items-center space-x-2">
          <Checkbox id="is_preferred" name="is_preferred" />
          <Label htmlFor="is_preferred" className="text-sm font-normal">
            Mark as preferred contractor
          </Label>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Link href="/estates-compliance/contractors">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Contractor"}
          </Button>
        </div>
      </form>
    </div>
  );
}

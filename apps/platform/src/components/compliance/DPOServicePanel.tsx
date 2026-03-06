"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  ExternalLink,
  Calendar,
  User,
  Phone,
  Mail,
  Building2,
  Star,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DPOServicePanelProps {
  organizationId: string;
}

interface DPOService {
  id: string;
  provider: string;
  tier: "standard" | "enhanced" | "premium";
  consultant_name: string;
  consultant_email: string;
  consultant_phone: string;
  sla_response_hours: number;
  contract_start: string;
  contract_end: string;
  ico_registration_number: string;
  ico_registration_expiry: string;
  service_includes: string[];
  status: "active" | "pending" | "expired";
}

interface ServiceTier {
  name: string;
  tier: "standard" | "enhanced" | "premium";
  price: string;
  priceNumeric: number;
  features: string[];
  recommended?: boolean;
}

const SERVICE_TIERS: ServiceTier[] = [
  {
    name: "Standard",
    tier: "standard",
    price: "1,200",
    priceNumeric: 1200,
    features: [
      "Named DPO consultant",
      "Annual DPIA reviews",
      "Data breach response (next business day)",
      "ICO registration management",
      "Policy template library",
      "Email & phone support (business hours)",
      "Annual compliance audit",
    ],
  },
  {
    name: "Enhanced",
    tier: "enhanced",
    price: "2,400",
    priceNumeric: 2400,
    recommended: true,
    features: [
      "Everything in Standard, plus:",
      "Quarterly DPIA reviews",
      "Data breach response (4 hours)",
      "Staff GDPR training sessions (x2/year)",
      "SAR handling support",
      "Monthly compliance reports",
      "Privacy notice reviews",
      "Telephone triage for data incidents",
    ],
  },
  {
    name: "Premium",
    tier: "premium",
    price: "4,800",
    priceNumeric: 4800,
    features: [
      "Everything in Enhanced, plus:",
      "Monthly DPIA reviews",
      "Data breach response (1 hour, 24/7)",
      "Unlimited staff training sessions",
      "Full SAR processing",
      "On-site DPO visits (quarterly)",
      "Governor/trustee GDPR briefings",
      "ICO correspondence handling",
      "Legal liaison support",
      "Priority response on all queries",
    ],
  },
];

export default function DPOServicePanel({
  organizationId,
}: DPOServicePanelProps) {
  const [service, setService] = useState<DPOService | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchService();
  }, [organizationId]);

  const fetchService = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/compliance/dpo-service?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setService(data.service || null);
      }
    } catch (error) {
      console.error("Failed to fetch DPO service:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysUntil = (dateStr: string) => {
    const now = new Date();
    const target = new Date(dateStr);
    return Math.ceil(
      (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </CardContent>
      </Card>
    );
  }

  // Active Service View
  if (service && service.status === "active") {
    const contractDaysLeft = getDaysUntil(service.contract_end);
    const icoExpiryDays = getDaysUntil(service.ico_registration_expiry);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-600" />
              DPO Service
            </h2>
            <p className="text-slate-500 mt-1">
              Outsourced Data Protection Officer service
            </p>
          </div>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
            Manage Service
          </Button>
        </div>

        {/* Service Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {service.provider}
                    </h3>
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                      Active
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-700 text-[10px] uppercase">
                      {service.tier}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    SLA: {service.sla_response_hours}-hour response time
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Consultant Details */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Your DPO Consultant
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">
                        {service.consultant_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <a
                        href={`mailto:${service.consultant_email}`}
                        className="text-purple-600 hover:underline"
                      >
                        {service.consultant_email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{service.consultant_phone}</span>
                    </div>
                  </div>
                </div>

                {/* Contract & ICO */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Contract & Registration
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Contract End
                      </span>
                      <span
                        className={`font-medium ${
                          contractDaysLeft <= 30
                            ? "text-amber-600"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {formatDate(service.contract_end)}
                        {contractDaysLeft <= 30 && (
                          <span className="text-xs ml-1">
                            ({contractDaysLeft} days)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        ICO Registration
                      </span>
                      <span className="font-mono text-xs">
                        {service.ico_registration_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        ICO Expiry
                      </span>
                      <span
                        className={`font-medium ${
                          icoExpiryDays <= 30
                            ? "text-amber-600"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {formatDate(service.ico_registration_expiry)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Includes */}
              {service.service_includes &&
                service.service_includes.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-xs font-bold uppercase text-slate-500 mb-3">
                      Service Includes
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {service.service_includes.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Marketing / No Service View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            DPO Service
          </h2>
          <p className="text-slate-500 mt-1">
            Outsourced Data Protection Officer service
          </p>
        </div>
      </div>

      {/* Marketing Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-950">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600 shrink-0">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Vrisk DPO Service for Schools
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Expert data protection officers who understand the unique
                  challenges schools face. From DPIA reviews and SAR handling to
                  breach response and staff training - let our specialists keep
                  you compliant.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                    ICO Registered
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                    Education Specialists
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                    UK Based
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SERVICE_TIERS.map((tier, idx) => (
          <motion.div
            key={tier.tier}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card
              className={`relative h-full flex flex-col ${
                tier.recommended
                  ? "border-purple-400 ring-2 ring-purple-200"
                  : "hover:border-purple-300"
              } transition-all`}
            >
              {tier.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white text-[10px] px-3">
                    <Star className="w-3 h-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    &pound;{tier.price}
                  </span>
                  <span className="text-sm text-slate-500">/year</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 flex-1">
                  {tier.features.map((feature, fIdx) => (
                    <li
                      key={fIdx}
                      className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-4 ${
                    tier.recommended
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  }`}
                >
                  Get a Quote
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Trust indicators */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              No lock-in contract
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Cancel anytime with 30 days notice
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Serving 200+ UK schools
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              GDPR & UK DPA 2018 compliant
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

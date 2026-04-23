/**
 * Pricing Calculator API
 *
 * Calculates subscription pricing for selected schools and modules.
 * Applies volume discounts and multi-school rules.
 *
 * POST /api/onboarding/calculate-pricing
 *
 * Body:
 * {
 *   schools: [
 *     {
 *       urn: string,
 *       name: string,
 *       modules: string[] // ["school-improvement", "business-management"]
 *     }
 *   ],
 *   billingOption: "trust" | "individual" | "split"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createClient();
  const body = await req.json();
  const { schools, billingOption = "trust" } = body;

  if (!schools || !Array.isArray(schools) || schools.length === 0) {
    return NextResponse.json(
      { error: "Schools array is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch pricing data
    const { data: modules } = await supabase
      .from("pricing_modules")
      .select("*")
      .eq("active", true)
      .order("sort_order");

    const { data: discounts } = await supabase
      .from("pricing_discounts")
      .select("*")
      .eq("active", true);

    if (!modules) {
      return NextResponse.json(
        { error: "Pricing data not available" },
        { status: 500 }
      );
    }

    // Calculate per-school pricing
    const schoolPricing = schools.map((school: any) => {
      const selectedModules = modules.filter((m: any) => school.modules.includes(m.module_id));

      const subtotal = selectedModules.reduce((sum: number, m: any) => sum + m.price_yearly, 0);

      return {
        urn: school.urn,
        name: school.name,
        modules: selectedModules.map((m: any) => ({
          id: m.module_id,
          name: m.name,
          price: m.price_yearly
        })),
        subtotal
      };
    });

    // Calculate trust total
    const trustSubtotal = schoolPricing.reduce((sum: number, s: any) => sum + s.subtotal, 0);

    // Apply discounts
    let discountPercentage = 0;
    let appliedDiscounts: any[] = [];

    // Check volume discounts (based on school count)
    const volumeDiscounts = discounts?.filter((d: any) =>
      d.type === "volume" &&
      schools.length >= (d.condition?.minSchools || 0)
    ) || [];

    for (const discount of volumeDiscounts) {
      if (discount.discount_percentage > discountPercentage) {
        discountPercentage = discount.discount_percentage;
        appliedDiscounts.push({
          type: "volume",
          name: discount.name,
          percentage: discount.discount_percentage,
          reason: `${schools.length} schools selected`
        });
      }
    }

    // Check trust-level discount (if billing to trust)
    if (billingOption === "trust") {
      const trustDiscount = discounts?.find((d: any) =>
        d.type === "trust" && d.condition?.requiresContract === "trust_level"
      );

      if (trustDiscount && trustDiscount.discount_percentage > discountPercentage) {
        discountPercentage = trustDiscount.discount_percentage;
        appliedDiscounts = [{
          type: "trust",
          name: trustDiscount.name,
          percentage: trustDiscount.discount_percentage,
          reason: "Trust-level billing"
        }];
      }
    }

    // Calculate final totals
    const discountAmount = trustSubtotal * (discountPercentage / 100);
    const total = trustSubtotal - discountAmount;

    return NextResponse.json({
      summary: {
        schoolCount: schools.length,
        subtotal: trustSubtotal,
        discount: discountAmount > 0 ? {
          percentage: discountPercentage,
          amount: discountAmount,
          applied: appliedDiscounts
        } : null,
        total,
        billingOption
      },
      schools: schoolPricing
    });

  } catch (error) {
    console.error("Pricing calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate pricing" },
      { status: 500 }
    );
  }
});

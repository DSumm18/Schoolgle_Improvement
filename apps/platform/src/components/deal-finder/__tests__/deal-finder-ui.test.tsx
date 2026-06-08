import React from "react";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { CategoryGrid } from "../CategoryGrid";
import { ComparisonResults } from "../ComparisonResults";
import { DealFinderApp } from "../DealFinderApp";
import { ShareDealModal } from "../ShareDealModal";
import { UrlInput } from "../UrlInput";
import type { ProductMatch, ScrapeResponse } from "@/lib/deal-finder/types";

vi.mock("@/context/SupabaseAuthContext", () => ({
  useAuth: () => ({
    organizationId: "org-1",
    session: { access_token: "test-token" },
  }),
}));

function match(overrides: Partial<ProductMatch>): ProductMatch {
  return {
    product_id: overrides.product_id || "match-1",
    product_name: overrides.product_name || "A4 Paper Alternative",
    product_description: overrides.product_description || "A4 white 80gsm paper",
    supplier_id: overrides.supplier_id || "supplier-1",
    supplier_name: overrides.supplier_name || "Supplier",
    price_gbp: overrides.price_gbp ?? 12.95,
    image_url: overrides.image_url ?? "https://example.com/image.jpg",
    source_url: overrides.source_url ?? "https://example.com/product",
    match_type: overrides.match_type || "category_equivalence",
    match_score: overrides.match_score ?? 80,
    saving_gbp: overrides.saving_gbp ?? 1.1,
    saving_pct: overrides.saving_pct ?? 7.8,
    pack_quantity: overrides.pack_quantity ?? 5,
    pack_unit: overrides.pack_unit || "ream",
    unit_price_each: overrides.unit_price_each ?? 2.59,
    source_comparison_quantity: overrides.source_comparison_quantity ?? 5,
    equivalent_quantity: overrides.equivalent_quantity ?? 5,
    equivalent_total_price: overrides.equivalent_total_price ?? 12.95,
    unit_saving_gbp: overrides.unit_saving_gbp ?? 0.22,
    unit_saving_pct: overrides.unit_saving_pct ?? 7.8,
    equivalence_type: overrides.equivalence_type || "alternative",
    value_score: overrides.value_score ?? 80,
    is_best_value: overrides.is_best_value ?? true,
    price_date: overrides.price_date ?? null,
    comparison_unit_label: overrides.comparison_unit_label || "per ream",
    rating_value: overrides.rating_value ?? null,
    rating_count: overrides.rating_count ?? null,
  };
}

function comparisonResponse(overrides: Partial<ScrapeResponse> = {}): ScrapeResponse {
  return {
    job_id: "job-1",
    status: "complete",
    product: {
      id: "product-1",
      name: "YPO A4 Rey Copy Paper 80gsm - 5 Reams",
      description: "A4 paper for school offices",
      price: 14.05,
      currency: "GBP",
      image_url: "https://example.com/source.jpg",
      source_url: "https://www.ypo.co.uk/product/detail/paper/110787",
      pack_quantity: 5,
      pack_unit: "ream",
      unit_weight_g: null,
      unit_price_each: 2.81,
      comparison_unit_label: "per ream",
      rating_value: null,
      rating_count: null,
    },
    matches: [match({})],
    best_saving_gbp: 1.1,
    best_saving_pct: 7.8,
    best_unit_saving_gbp: 0.22,
    best_unit_saving_pct: 7.8,
    best_value_match_id: "match-1",
    match_count: 1,
    duration_ms: 1500,
    discovery_pending: false,
    retailer_search_links: [
      {
        supplier_name: "Amazon Business UK",
        url: "https://www.amazon.co.uk/s?k=A4+paper&tag=schoolgle1-21",
        price_verified: false,
        reason: "Amazon prices can change quickly.",
      },
    ],
    ...overrides,
  };
}

describe("Deal Finder UI controls", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { alerts: [] } }),
    }) as unknown as typeof fetch;
  });

  test("URL input validates bad URLs and submits valid URLs", () => {
    const onSubmit = vi.fn();
    render(<UrlInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText("Paste an Amazon, YPO, TTS or supplier product URL");
    const findButton = screen.getByRole("button", { name: "Find Deals" });

    expect(findButton).toBeDisabled();

    fireEvent.change(input, { target: { value: "not a url" } });
    fireEvent.click(findButton);
    expect(screen.getByText("Please enter a valid URL")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "https://www.viking-direct.co.uk/en/p/1022616" } });
    fireEvent.click(findButton);
    expect(onSubmit).toHaveBeenCalledWith("https://www.viking-direct.co.uk/en/p/1022616");
  });

  test("paste button has an accessible name and searches when clipboard contains a URL", async () => {
    const onSubmit = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        readText: vi.fn().mockResolvedValue("https://www.ypo.co.uk/product/110787"),
      },
    });

    render(<UrlInput onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Paste URL from clipboard" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("https://www.ypo.co.uk/product/110787");
    });
  });

  test("category cards call back with the selected school category", () => {
    const onCategorySelect = vi.fn();
    render(<CategoryGrid onCategorySelect={onCategorySelect} />);

    fireEvent.click(screen.getByRole("button", { name: /Stationery/i }));

    expect(onCategorySelect).toHaveBeenCalledWith("Stationery");
  });

  test("results render recommendation, Amazon check, filters, and supplier links", async () => {
    const data = comparisonResponse({
      matches: [
        match({ product_id: "same", product_name: "Same A4 Paper", equivalence_type: "identical" }),
        match({ product_id: "alt", product_name: "Alternative A4 Paper", equivalence_type: "alternative", is_best_value: false }),
      ],
      match_count: 2,
    });

    render(<ComparisonResults data={data} organizationId="org-1" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tools/deal-finder/thresholds?organizationId=org-1",
        expect.any(Object),
      );
    });

    expect(screen.getByText("Smart buying recommendation")).toBeInTheDocument();
    expect(screen.getByText("Amazon live price check")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Check Amazon/i })).toHaveAttribute(
      "href",
      expect.stringContaining("tag=schoolgle1-21"),
    );
    expect(screen.getAllByRole("link", { name: /View Deal/i })[0]).toHaveAttribute("href");

    fireEvent.click(screen.getByRole("button", { name: "Same Product" }));
    expect(screen.getByText("Same A4 Paper")).toBeInTheDocument();
    expect(screen.queryByText("Alternative A4 Paper")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Alternatives" }));
    expect(screen.getByText("Alternative A4 Paper")).toBeInTheDocument();
    expect(screen.queryByText("Same A4 Paper")).not.toBeInTheDocument();
  });

  test("share deal modal validates, submits, and closes", async () => {
    const onClose = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { success: true } }),
    }) as unknown as typeof fetch;

    render(<ShareDealModal isOpen onClose={onClose} organizationId="org-1" />);

    fireEvent.change(screen.getByPlaceholderText("e.g. YPO A4 Copier Paper 80gsm"), {
      target: { value: "A4 Paper 80gsm 5 Reams" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. YPO"), {
      target: { value: "YPO" },
    });
    fireEvent.change(screen.getByPlaceholderText("https://..."), {
      target: { value: "https://www.ypo.co.uk/product/110787" },
    });
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "14.05" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Share Deal" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tools/deal-finder/community?organizationId=org-1",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });
    expect(await screen.findByText("Deal Shared!")).toBeInTheDocument();
  });

  test("share deal modal cancel and close buttons call onClose", () => {
    const onClose = vi.fn();
    const first = render(<ShareDealModal isOpen onClose={onClose} organizationId="org-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    first.unmount();

    render(<ShareDealModal isOpen onClose={onClose} organizationId="org-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Close share deal" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  test("app shell opens share modal and renders scrape results from URL search", async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/tools/deal-finder/thresholds")) {
        return {
          ok: true,
          json: async () => ({ data: { alerts: [] } }),
        } as Response;
      }
      if (url.includes("/api/tools/deal-finder/scrape")) {
        return {
          ok: true,
          json: async () => comparisonResponse(),
        } as Response;
      }
      throw new Error(`Unexpected fetch ${url}`);
    }) as unknown as typeof fetch;

    render(<DealFinderApp />);

    fireEvent.click(screen.getByRole("button", { name: "Share a Deal" }));
    expect(screen.getByRole("heading", { name: "Share a Deal" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.change(
      screen.getByPlaceholderText("Paste an Amazon, YPO, TTS or supplier product URL"),
      { target: { value: "https://www.ypo.co.uk/product/detail/paper/110787" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Find Deals" }));

    expect(await screen.findByText("Smart buying recommendation")).toBeInTheDocument();
    expect(screen.getByText("Amazon live price check")).toBeInTheDocument();
    expect(screen.getByText("YPO A4 Rey Copy Paper 80gsm - 5 Reams")).toBeInTheDocument();
  });

  test("app shell category buttons render returned community alternatives", async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/tools/deal-finder/thresholds")) {
        return {
          ok: true,
          json: async () => ({ data: { alerts: [] } }),
        } as Response;
      }
      if (url.includes("/api/tools/deal-finder/search")) {
        return {
          ok: true,
          json: async () => ({
            data: {
              alternatives: [
                {
                  id: "community-a4",
                  title: "Community A4 Paper 5 Reams",
                  description: "White 80gsm A4 paper shared by another school.",
                  image_url: "https://example.com/community-a4.jpg",
                  price: 13.5,
                  pack_qty: 5,
                  unit_price: 2.7,
                  supplier: "Community Supplier",
                  source_url: "https://example.com/community-a4",
                  saving: null,
                  saving_pct: null,
                  unit_saving: null,
                  unit_saving_pct: null,
                },
              ],
            },
          }),
        } as Response;
      }
      throw new Error(`Unexpected fetch ${url}`);
    }) as unknown as typeof fetch;

    render(<DealFinderApp />);

    fireEvent.click(screen.getByRole("button", { name: /Stationery/i }));

    expect(await screen.findByText("Community A4 Paper 5 Reams")).toBeInTheDocument();
    expect(screen.getByText("1 alternative found")).toBeInTheDocument();
  });
});

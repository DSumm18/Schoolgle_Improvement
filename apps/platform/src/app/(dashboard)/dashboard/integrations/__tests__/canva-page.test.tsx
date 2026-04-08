import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock framer-motion before importing the component
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target: any, prop: any) => {
        return ({ children, ...props }: any) => {
          const { initial, animate, exit, transition, whileHover, layout, ...rest } = props;
          const Tag = typeof prop === "string" ? prop : "div";
          return <Tag {...rest}>{children}</Tag>;
        };
      },
    },
  ),
  AnimatePresence: ({ children }: any) => children,
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import CanvaTemplatesPage from "../canva/page";

describe("CanvaTemplatesPage", () => {
  it("renders the page header", () => {
    render(<CanvaTemplatesPage />);
    expect(screen.getByText("Template Library")).toBeInTheDocument();
    expect(screen.getByText(/School-branded Canva templates/)).toBeInTheDocument();
  });

  it("renders a back link to connectors hub", () => {
    render(<CanvaTemplatesPage />);
    const backLink = screen.getByText("Back to Connectors");
    expect(backLink.closest("a")).toHaveAttribute(
      "href",
      "/dashboard/integrations",
    );
  });

  it("renders the hero section", () => {
    render(<CanvaTemplatesPage />);
    expect(
      screen.getByText("Design like a pro, in minutes"),
    ).toBeInTheDocument();
    expect(screen.getByText("5 categories")).toBeInTheDocument();
    expect(screen.getAllByText("30 templates").length).toBeGreaterThanOrEqual(1);
  });

  it("renders all 30 templates", () => {
    render(<CanvaTemplatesPage />);
    const openButtons = screen.getAllByText("Open in Canva");
    expect(openButtons).toHaveLength(30);
  });

  it("filters by category", () => {
    render(<CanvaTemplatesPage />);

    // Click Newsletter filter
    fireEvent.click(screen.getByText("Newsletter (6)"));
    let openButtons = screen.getAllByText("Open in Canva");
    expect(openButtons).toHaveLength(6);

    // Click Governor filter
    fireEvent.click(screen.getByText("Governor (6)"));
    openButtons = screen.getAllByText("Open in Canva");
    expect(openButtons).toHaveLength(6);

    // Click All to reset
    fireEvent.click(screen.getByText("All (30)"));
    openButtons = screen.getAllByText("Open in Canva");
    expect(openButtons).toHaveLength(30);
  });

  it("filters by search text", () => {
    render(<CanvaTemplatesPage />);
    const searchInput = screen.getByPlaceholderText("Search templates...");

    fireEvent.change(searchInput, { target: { value: "fire" } });
    expect(screen.getByText("Fire Evacuation Poster")).toBeInTheDocument();
    // Should not show unrelated templates
    expect(
      screen.queryByText("Weekly School Newsletter"),
    ).not.toBeInTheDocument();
  });

  it("shows empty state when no results match", () => {
    render(<CanvaTemplatesPage />);
    const searchInput = screen.getByPlaceholderText("Search templates...");

    fireEvent.change(searchInput, { target: { value: "xyznonexistent" } });
    expect(screen.getByText("No templates found")).toBeInTheDocument();
  });

  it("renders the request template CTA", () => {
    render(<CanvaTemplatesPage />);
    expect(screen.getByText("Request a Template")).toBeInTheDocument();
    expect(
      screen.getByText(/Can't find what you need/),
    ).toBeInTheDocument();
  });

  it("renders all 5 category filter buttons", () => {
    render(<CanvaTemplatesPage />);
    expect(screen.getByText("Newsletter (6)")).toBeInTheDocument();
    expect(screen.getByText("Letter (6)")).toBeInTheDocument();
    expect(screen.getByText("Display (6)")).toBeInTheDocument();
    expect(screen.getByText("Governor (6)")).toBeInTheDocument();
    expect(screen.getByText("Estate (6)")).toBeInTheDocument();
  });
});

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

import IntegrationsPage from "../page";

describe("IntegrationsPage", () => {
  it("renders the page header with title and description", () => {
    render(<IntegrationsPage />);
    expect(screen.getByText("Connectors")).toBeInTheDocument();
    expect(screen.getByText("Integrations")).toBeInTheDocument();
  });

  it("renders all 8 connector cards", () => {
    render(<IntegrationsPage />);
    expect(screen.getByText("Canva")).toBeInTheDocument();
    expect(screen.getByText("Google Drive")).toBeInTheDocument();
    expect(screen.getByText("Arbor MIS")).toBeInTheDocument();
    expect(screen.getByText("SIMS MIS")).toBeInTheDocument();
    expect(screen.getByText("Bromcom MIS")).toBeInTheDocument();
    expect(screen.getByText("NotebookLM")).toBeInTheDocument();
    expect(screen.getByText("ParentMail")).toBeInTheDocument();
    expect(screen.getByText("DfE APIs")).toBeInTheDocument();
  });

  it("shows correct status badges", () => {
    render(<IntegrationsPage />);
    const activeBadges = screen.getAllByText("Active");
    const comingSoonBadges = screen.getAllByText("Coming Soon");
    const plannedBadges = screen.getAllByText("Planned");

    expect(activeBadges).toHaveLength(2); // Canva + Google Drive
    expect(comingSoonBadges).toHaveLength(4); // 3 MIS + NotebookLM
    expect(plannedBadges).toHaveLength(2); // ParentMail + DfE APIs
  });

  it("filters connectors by search", () => {
    render(<IntegrationsPage />);
    const searchInput = screen.getByPlaceholderText("Search connectors...");

    fireEvent.change(searchInput, { target: { value: "canva" } });
    expect(screen.getByText("Canva")).toBeInTheDocument();
    expect(screen.queryByText("Google Drive")).not.toBeInTheDocument();
    expect(screen.queryByText("Arbor MIS")).not.toBeInTheDocument();
  });

  it("links active connectors to their pages", () => {
    render(<IntegrationsPage />);
    const canvaLink = screen.getByText("Canva").closest("a");
    expect(canvaLink).toHaveAttribute("href", "/dashboard/integrations/canva");
  });

  it("renders the feature banner", () => {
    render(<IntegrationsPage />);
    expect(
      screen.getByText(/Your school's data, woven together/),
    ).toBeInTheDocument();
  });
});

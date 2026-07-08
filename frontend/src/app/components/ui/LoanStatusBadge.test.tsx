import { render, screen } from "@testing-library/react";
import { LoanStatusBadge } from "./LoanStatusBadge";

describe("LoanStatusBadge", () => {
  it.each([
    { status: "active", expected: "Active" },
    { status: "pending", expected: "Pending" },
    { status: "repaid", expected: "Repaid" },
    { status: "defaulted", expected: "Defaulted" },
    { status: "liquidated", expected: "Liquidated" },
  ])("displays '$expected' for status '$status'", ({ status, expected }) => {
    render(<LoanStatusBadge status={status} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.getByTitle(`Loan status: ${expected}`)).toBeInTheDocument();
  });

  it("falls back to raw status string for unknown statuses", () => {
    render(<LoanStatusBadge status="unknown_status" />);
    expect(screen.getByText("unknown_status")).toBeInTheDocument();
    expect(screen.getByTitle("Loan status: unknown_status")).toBeInTheDocument();
  });

  it("applies custom className to the outer container", () => {
    render(<LoanStatusBadge status="active" className="custom-class" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toContain("custom-class");
  });
});

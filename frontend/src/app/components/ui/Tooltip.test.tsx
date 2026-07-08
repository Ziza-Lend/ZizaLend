import { render, screen } from "@testing-library/react";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  it("renders the info button", () => {
    render(<Tooltip content="Helpful information" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("has accessible label via aria-label on button", () => {
    render(<Tooltip content="Info" label="More info" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "More info");
  });

  it("has default aria-label", () => {
    render(<Tooltip content="Info" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "More info");
  });

  it("associates the tooltip content with the button via aria-describedby", () => {
    render(<Tooltip content="Detailed explanation" />);
    const button = screen.getByRole("button");
    const describedBy = button.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const tooltip = document.getElementById(describedBy!);
    expect(tooltip).toHaveAttribute("role", "tooltip");
    expect(tooltip).toHaveTextContent("Detailed explanation");
  });

  it("renders tooltip content text", () => {
    render(<Tooltip content="Helpful information" />);
    expect(screen.getByText("Helpful information")).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<Tooltip content="Content" label="Custom label" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Custom label");
  });

  it("applies custom className", () => {
    render(<Tooltip content="Content" className="custom-class" />);
    // The className is applied to the wrapper span
    const wrapper = screen.getByRole("button").parentElement;
    expect(wrapper?.className).toContain("custom-class");
  });
});

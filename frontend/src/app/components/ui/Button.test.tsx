import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies the primary variant by default", () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-violet-600");
  });

  it("applies the secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-[");
  });

  it("applies the outline variant", () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("border");
    expect(btn.className).toContain("bg-transparent");
  });

  it("applies the ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-transparent");
    expect(btn.className).toContain("hover:bg-[");
  });

  it("applies the danger variant", () => {
    render(<Button variant="danger">Danger</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-red-600");
  });

  it("applies size classes correctly", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button").className).toContain("h-8");

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button").className).toContain("h-12");

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole("button").className).toContain("h-10 w-10");
  });

  it("shows loading spinner when isLoading is true", () => {
    render(<Button isLoading>Loading</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders left icon", () => {
    render(<Button leftIcon={<span data-testid="left-icon">🔍</span>}>Search</Button>);
    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
  });

  it("renders right icon", () => {
    render(<Button rightIcon={<span data-testid="right-icon">→</span>}>Next</Button>);
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
  });

  it("does not render icons when loading", () => {
    render(
      <Button
        isLoading
        leftIcon={<span data-testid="left-icon">🔍</span>}
        rightIcon={<span data-testid="right-icon">→</span>}
      >
        Loading
      </Button>,
    );
    expect(screen.queryByTestId("left-icon")).not.toBeInTheDocument();
    expect(screen.queryByTestId("right-icon")).not.toBeInTheDocument();
  });

  it("forwards additional HTML button props", () => {
    render(
      <Button type="submit" data-testid="custom-btn">
        Submit
      </Button>,
    );
    const btn = screen.getByTestId("custom-btn");
    expect(btn).toHaveAttribute("type", "submit");
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Styled</Button>);
    expect(screen.getByRole("button").className).toContain("custom-class");
  });

  it("has correct displayName", () => {
    expect(Button.displayName).toBe("Button");
  });
});

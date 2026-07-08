import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "./Input";

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders with a label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("associates label with input via htmlFor", () => {
    render(<Input label="Name" id="name-input" />);
    const label = screen.getByText("Name");
    const input = screen.getByLabelText("Name");
    expect(label).toHaveAttribute("for", "name-input");
    expect(input).toHaveAttribute("id", "name-input");
  });

  it("displays error message and sets aria-invalid", () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email");
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("links error to input via aria-describedby", () => {
    render(<Input label="Email" error="Required" id="email" />);
    const input = screen.getByLabelText("Email");
    const error = screen.getByRole("alert");
    expect(input).toHaveAttribute("aria-describedby", error.id);
  });

  it("displays helper text", () => {
    render(<Input label="Password" helperText="Must be 8+ characters" />);
    expect(screen.getByText("Must be 8+ characters")).toBeInTheDocument();
  });

  it("prefers error over helper text when both are provided", () => {
    render(<Input label="Name" error="This is required" helperText="Enter your full name" />);
    expect(screen.getByRole("alert")).toHaveTextContent("This is required");
    expect(screen.queryByText("Enter your full name")).not.toBeInTheDocument();
  });

  it("renders left icon", () => {
    render(<Input leftIcon={<span data-testid="left-icon">🔍</span>} />);
    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
  });

  it("renders right icon", () => {
    render(<Input rightIcon={<span data-testid="right-icon">✓</span>} />);
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
  });

  it("shows required asterisk when required prop is set", () => {
    render(<Input label="Email" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("forwards ref to the input element", () => {
    const ref = jest.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("applies custom className", () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole("textbox").className).toContain("custom-class");
  });

  it("handles value changes", () => {
    const onChange = jest.fn();
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "test" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("disables input when disabled prop is set", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("has correct displayName", () => {
    expect(Input.displayName).toBe("Input");
  });
});

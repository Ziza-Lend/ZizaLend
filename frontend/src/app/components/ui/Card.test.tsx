import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./Card";

describe("Card", () => {
  it("renders children content", () => {
    render(<Card>Hello World</Card>);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders with default styling classes", () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId("card");
    expect(card.className).toContain("rounded-xl");
    expect(card.className).toContain("border");
    expect(card.className).toContain("shadow-sm");
  });

  it("applies custom className", () => {
    render(<Card className="custom-class">Content</Card>);
    expect(screen.getByText("Content").className).toContain("custom-class");
  });

  it("renders CardHeader", () => {
    render(
      <Card>
        <CardHeader data-testid="header">Header</CardHeader>
      </Card>,
    );
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("header").className).toContain("p-6");
  });

  it("renders CardTitle as h3", () => {
    render(
      <Card>
        <CardTitle>Section Title</CardTitle>
      </Card>,
    );
    const title = screen.getByRole("heading", { name: "Section Title" });
    expect(title.tagName).toBe("H3");
    expect(title.className).toContain("text-2xl");
    expect(title.className).toContain("font-semibold");
  });

  it("renders CardDescription", () => {
    render(
      <Card>
        <CardDescription>This is a helpful description</CardDescription>
      </Card>,
    );
    const desc = screen.getByText("This is a helpful description");
    expect(desc.className).toContain("text-sm");
    expect(desc.className).toContain("text-gray-500");
  });

  it("renders CardContent", () => {
    render(
      <Card>
        <CardContent>Body content</CardContent>
      </Card>,
    );
    const content = screen.getByText("Body content");
    expect(content.className).toContain("p-6");
    expect(content.className).toContain("pt-0");
  });

  it("renders CardFooter", () => {
    render(
      <Card>
        <CardFooter>Footer actions</CardFooter>
      </Card>,
    );
    const footer = screen.getByText("Footer actions");
    expect(footer.className).toContain("flex");
    expect(footer.className).toContain("items-center");
    expect(footer.className).toContain("p-6");
    expect(footer.className).toContain("pt-0");
  });

  it("renders complete card composition", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByRole("heading", { name: "Title" })).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("has correct displayNames for all sub-components", () => {
    expect(Card.displayName).toBe("Card");
    expect(CardHeader.displayName).toBe("CardHeader");
    expect(CardTitle.displayName).toBe("CardTitle");
    expect(CardDescription.displayName).toBe("CardDescription");
    expect(CardContent.displayName).toBe("CardContent");
    expect(CardFooter.displayName).toBe("CardFooter");
  });
});

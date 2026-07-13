import { render, screen } from "@testing-library/react";
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonChart,
  SkeletonAvatar,
  SkeletonRow,
} from "./Skeleton";

describe("Skeleton", () => {
  it("renders with animation classes", () => {
    render(<Skeleton data-testid="skel" />);
    const el = screen.getByTestId("skel");
    expect(el.className).toContain("animate-shimmer");
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("applies custom className", () => {
    render(<Skeleton className="custom-class" data-testid="skel" />);
    expect(screen.getByTestId("skel").className).toContain("custom-class");
  });
});

describe("SkeletonText", () => {
  it("renders a single line by default", () => {
    render(<SkeletonText />);
    const lines = screen.getByText(
      (_, element) => element?.tagName === "DIV" && !!element?.className?.includes("space-y-2"),
    );
    expect(lines.children).toHaveLength(1);
  });

  it("renders the specified number of lines", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const skeletonElements = container.querySelectorAll(".animate-shimmer");
    expect(skeletonElements).toHaveLength(3);
  });
});

describe("SkeletonCard", () => {
  it("renders with accessibility attributes", () => {
    render(<SkeletonCard />);
    const card = screen.getByRole("status");
    expect(card).toHaveAttribute("aria-label", "Loading card content");
  });
});

describe("SkeletonChart", () => {
  it("renders with accessibility attributes", () => {
    render(<SkeletonChart />);
    const chart = screen.getByRole("status");
    expect(chart).toHaveAttribute("aria-label", "Loading chart");
  });
});

describe("SkeletonAvatar", () => {
  it("renders with medium size by default", () => {
    const { container } = render(<SkeletonAvatar />);
    const avatar = container.querySelector(".animate-shimmer");
    expect(avatar?.className).toContain("h-10");
    expect(avatar?.className).toContain("w-10");
  });

  it("renders with small size", () => {
    const { container } = render(<SkeletonAvatar size="sm" />);
    const avatar = container.querySelector(".animate-shimmer");
    expect(avatar?.className).toContain("h-8");
    expect(avatar?.className).toContain("w-8");
  });

  it("renders with large size", () => {
    const { container } = render(<SkeletonAvatar size="lg" />);
    const avatar = container.querySelector(".animate-shimmer");
    expect(avatar?.className).toContain("h-12");
    expect(avatar?.className).toContain("w-12");
  });
});

describe("SkeletonRow", () => {
  it("renders with an avatar and text lines", () => {
    const { container } = render(<SkeletonRow />);
    const animatedElements = container.querySelectorAll(".animate-shimmer");
    // Avatar (1) + title skeleton (1) + subtitle skeleton (1) + amount skeleton (1) + label skeleton (1)
    expect(animatedElements.length).toBeGreaterThanOrEqual(5);
  });
});

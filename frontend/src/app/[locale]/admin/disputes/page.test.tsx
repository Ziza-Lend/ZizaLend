import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminDisputesPage from "./page";
import { useUserStore } from "../../../stores/useUserStore";
import { useAdminDisputes, useVerifySession } from "../../../hooks/useApi";

const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => {
    const messages: Record<string, string> = {
      eyebrow: "Admin Review",
      title: "Disputes",
      description: "Review open default disputes and record the final resolution.",
      checkingAccess: "Checking admin access...",
      refresh: "Refresh",
      loading: "Loading disputes...",
      review: "Review",
      "empty.title": "No open disputes",
      "empty.description": "New borrower disputes will appear here as they are filed.",
      "table.borrower": "Borrower",
      "table.loanId": "Loan ID",
      "table.reason": "Reason summary",
      "table.submitted": "Submitted",
      "table.action": "Action",
    };
    return (key: string) => messages[key] ?? key;
  },
}));

jest.mock("../../../hooks/useSSE", () => ({
  useSSE: jest.fn(),
}));

jest.mock("../../../hooks/useApi", () => {
  const actual = jest.requireActual("../../../hooks/useApi");
  return {
    ...actual,
    useAdminDisputes: jest.fn(),
    useVerifySession: jest.fn(),
  };
});

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <AdminDisputesPage />
    </QueryClientProvider>,
  );
}

describe("AdminDisputesPage", () => {
  beforeEach(() => {
    replace.mockClear();
    useUserStore.setState({
      user: null,
      authToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    jest.mocked(useAdminDisputes).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useAdminDisputes>);
    jest.mocked(useVerifySession).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown as ReturnType<typeof useVerifySession>);
  });

  it("renders for admin users", () => {
    useUserStore.setState({
      user: {
        id: "admin",
        email: "admin@example.com",
        kycVerified: true,
        role: "admin",
      },
      authToken: "token",
      isAuthenticated: true,
    });

    renderPage();

    expect(screen.getByRole("heading", { name: "Disputes" })).toBeInTheDocument();
    expect(screen.getByText("No open disputes")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects non-admin users", async () => {
    useUserStore.setState({
      user: {
        id: "borrower",
        email: "borrower@example.com",
        kycVerified: true,
        role: "borrower",
      },
      authToken: "token",
      isAuthenticated: true,
    });

    renderPage();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });
});

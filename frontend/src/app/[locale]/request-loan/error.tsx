"use client";

import { RouteErrorView } from "../../components/global_ui/RouteErrorView";

export default function RequestLoanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorView error={error} reset={reset} scope="request loan page" />;
}

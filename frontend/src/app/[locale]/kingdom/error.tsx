"use client";

import { RouteErrorView } from "../../components/global_ui/RouteErrorView";

export default function KingdomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorView error={error} reset={reset} scope="kingdom page" />;
}

"use client";

// This route is intentionally gated from production — it is a development-only
// component gallery. If accidentally shipped, requests are bounced to 404.
import { notFound } from "next/navigation";
import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { Skeleton, SkeletonText, SkeletonCard, SkeletonRow } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusIndicator } from "../../components/ui/StatusIndicator";
import { LoanStatusBadge } from "../../components/ui/LoanStatusBadge";
import { Tooltip } from "../../components/ui/Tooltip";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { CopyButton } from "../../components/ui/CopyButton";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import {
  Search,
  Mail,
  Lock,
  User,
  Terminal,
  ChevronRight,
  Inbox,
  FileQuestion,
} from "lucide-react";

export default function UIDemoPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(3);
  const totalPages = 10;

  const handleAction = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl space-y-12">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50">
              UI Component Library
            </h1>
            <ThemeToggle />
          </div>
          <p className="text-lg text-gray-500 dark:text-zinc-400">
            Development-only gallery — not shipped to production. Covers all 22 components in{" "}
            <code className="text-sm">src/app/components/ui/</code>.
          </p>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <SectionHeading>Button</SectionHeading>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
              <div className="mt-8 flex flex-wrap items-end gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" variant="outline">
                  <Terminal size={18} />
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button isLoading={isLoading} onClick={handleAction}>
                  Click to Load
                </Button>
                <Button leftIcon={<Mail size={16} />}>Mail Icon</Button>
                <Button rightIcon={<ChevronRight size={16} />} variant="secondary">
                  Next Step
                </Button>
                <Button disabled>Disabled</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Inputs */}
        <section className="space-y-6">
          <SectionHeading>Input</SectionHeading>
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Input label="Email" placeholder="you@example.com" leftIcon={<Mail size={18} />} />
                <Input label="Username" placeholder="johndoe" leftIcon={<User size={18} />} />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock size={18} />}
                  helperText="Must be at least 8 characters."
                />
                <Input
                  label="Search"
                  placeholder="Search resources..."
                  leftIcon={<Search size={18} />}
                />
                <Input
                  label="Error State"
                  placeholder="Invalid input"
                  error="This field is required."
                />
                <Input label="Disabled State" value="Locked value" disabled />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards */}
        <section className="space-y-6">
          <SectionHeading>Card</SectionHeading>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Account Overview</CardTitle>
                <CardDescription>Manage your profile and settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-zinc-900">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tier</span>
                    <span className="text-sm font-medium">Premium</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className="text-sm font-medium text-green-500">Active</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-2 text-sm text-gray-500">
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button size="sm">Save Changes</Button>
              </CardFooter>
            </Card>

            <Card className="border-blue-100 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-blue-400">Pro Features</CardTitle>
                <CardDescription>Unlock advanced analytics and priority support.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-blue-900/80 dark:text-blue-100/70">
                  Upgrade to our Pro plan to get access to custom workflows, team collaboration
                  tools, and more.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Upgrade Now</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Modals */}
        <section className="space-y-6">
          <SectionHeading>Modal</SectionHeading>
          <Card>
            <CardContent className="flex h-40 flex-col items-center justify-center pt-6">
              <p className="mb-4 text-sm text-gray-500">
                Focus-trapped, animated, keyboard-dismissible.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>Open Demo Modal</Button>
              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Privacy Settings"
              >
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Are you sure you want to update your privacy settings? This will affect how your
                    data is displayed to others.
                  </p>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsModalOpen(false)}>Confirm Changes</Button>
                  </div>
                </div>
              </Modal>
            </CardContent>
          </Card>
        </section>

        {/* Skeleton */}
        <section className="space-y-6">
          <SectionHeading>Skeleton</SectionHeading>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SkeletonCard</CardTitle>
              </CardHeader>
              <CardContent>
                <SkeletonCard />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SkeletonRow × 3</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SkeletonText</CardTitle>
              </CardHeader>
              <CardContent>
                <SkeletonText lines={4} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skeleton (raw)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* EmptyState */}
        <section className="space-y-6">
          <SectionHeading>EmptyState</SectionHeading>
          <div className="grid gap-6 md:grid-cols-2">
            <EmptyState
              icon={Inbox}
              title="No notifications"
              description="You're all caught up. New notifications will appear here."
            />
            <EmptyState
              icon={FileQuestion}
              title="No results found"
              description="Try adjusting your search or filter criteria to find what you're looking for."
              actionLabel="Clear filters"
              onAction={() => {}}
            />
          </div>
        </section>

        {/* StatusIndicator + LoanStatusBadge */}
        <section className="space-y-6">
          <SectionHeading>StatusIndicator &amp; LoanStatusBadge</SectionHeading>
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  StatusIndicator tones
                </p>
                <div className="flex flex-wrap gap-3">
                  <StatusIndicator label="Success" tone="success" />
                  <StatusIndicator label="Danger" tone="danger" />
                  <StatusIndicator label="Warning" tone="warning" />
                  <StatusIndicator label="Info" tone="info" />
                  <StatusIndicator label="Neutral" tone="neutral" />
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  LoanStatusBadge statuses
                </p>
                <div className="flex flex-wrap gap-3">
                  <LoanStatusBadge status="active" />
                  <LoanStatusBadge status="pending" />
                  <LoanStatusBadge status="repaid" />
                  <LoanStatusBadge status="defaulted" />
                  <LoanStatusBadge status="liquidated" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tooltip */}
        <section className="space-y-6">
          <SectionHeading>Tooltip</SectionHeading>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Credit score</span>
              <Tooltip content="Your credit score is calculated from your on-chain remittance history over the past 12 months." />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Interest rate</span>
              <Tooltip
                content="Variable rate tied to the pool utilisation ratio. Updated every epoch."
                label="Interest rate info"
              />
            </CardContent>
          </Card>
        </section>

        {/* PaginationControls */}
        <section className="space-y-6">
          <SectionHeading>PaginationControls</SectionHeading>
          <Card>
            <CardContent className="pt-6">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                hasPrevious={currentPage > 1}
                hasNext={currentPage < totalPages}
                onPageChange={setCurrentPage}
                onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
                onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                summary={`Page ${currentPage} of ${totalPages}`}
              />
            </CardContent>
          </Card>
        </section>

        {/* CopyButton */}
        <section className="space-y-6 pb-12">
          <SectionHeading>CopyButton</SectionHeading>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <code className="rounded bg-zinc-100 px-3 py-1.5 font-mono text-sm dark:bg-zinc-900">
                GBDNQ...XKJA
              </code>
              <CopyButton value="GBDNQP7PQUXFZ4MGASIWMZZMTEVXKJA" />
              <span className="text-xs text-zinc-400">Click the icon to copy</span>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-zinc-200">
      <ChevronRight className="text-blue-500" />
      <h2>{children}</h2>
    </div>
  );
}

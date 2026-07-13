"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HandCoins,
  PiggyBank,
  SendHorizontal,
  Settings,
  X,
  CreditCard,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTranslations, useLocale } from "next-intl";
import {
  useWalletStore,
  selectWalletStatus,
  selectWalletNetwork,
} from "../../stores/useWalletStore";
import { useUserStore } from "../../stores/useUserStore";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getTokenRole(token: string | null): string | undefined {
  if (!token || typeof window === "undefined") return undefined;

  try {
    const payload = token.split(".")[1];
    if (!payload) return undefined;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return (JSON.parse(window.atob(padded)) as { role?: string }).role;
  } catch {
    return undefined;
  }
}

interface SidebarProps {
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("Navigation");
  const locale = useLocale();

  const status = useWalletStore(selectWalletStatus);
  const network = useWalletStore(selectWalletNetwork);
  const user = useUserStore((state) => state.user);
  const token = useUserStore((state) => state.authToken);
  const isConnected = status === "connected";
  const isAdmin = (user?.role ?? getTokenRole(token)) === "admin";

  const navItems = [
    { name: t("home"), href: `/${locale}`, icon: LayoutDashboard },
    { name: t("loans"), href: `/${locale}/loans`, icon: HandCoins },
    { name: "Lend", href: `/${locale}/lend`, icon: PiggyBank },
    { name: t("liquidations"), href: `/${locale}/liquidations`, icon: ShieldAlert },
    { name: t("activity"), href: `/${locale}/activity`, icon: Clock },
    { name: "Wallet", href: `/${locale}/wallet`, icon: CreditCard },
    ...(isAdmin
      ? [{ name: t("adminDisputes"), href: `/${locale}/admin/disputes`, icon: ShieldAlert }]
      : []),
  ];

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        "flex h-full w-64 flex-col border-r border-[var(--border-default)] bg-[var(--bg-primary)]",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-between px-6 border-b border-[var(--border-default)]">
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-[var(--shadow-glow)]">
            <SendHorizontal className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
            Zizalend
          </span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] lg:hidden rounded-lg"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto" aria-label="Site navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-500/10 text-violet-400 border-l-[3px] border-teal-400 pl-[9px]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]",
              )}
            >
              <item.icon
                aria-hidden="true"
                className={cn("h-5 w-5", isActive ? "text-violet-400" : "text-[var(--text-muted)]")}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--border-default)]">
        <div className="rounded-xl bg-[var(--bg-surface)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Wallet Status
          </p>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isConnected
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                  : "bg-[var(--text-muted)]",
              )}
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {isConnected ? `${network?.name || "Connected"}` : "Disconnected"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

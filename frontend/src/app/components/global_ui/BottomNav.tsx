"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, HandCoins, PiggyBank, Swords, User, Clock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useLocale } from "next-intl";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Citadel", href: "/", icon: LayoutDashboard },
  { name: "Borrow", href: "/loans", icon: HandCoins },
  { name: "Vaults", href: "/lend", icon: PiggyBank },
  { name: "Quests", href: "/kingdom", icon: Swords },
  { name: "Empire", href: "/activity", icon: Clock },
];

export function BottomNav() {
  const pathname = usePathname();
  const locale = useLocale();

  // Normalize pathname to handle locale prefix
  const getHref = (href: string) => `/${locale}${href === "/" ? "" : href}`;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-default)] bg-[var(--bg-primary)]/95 backdrop-blur-xl lg:hidden"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === `/${locale}${item.href}` ||
            (item.href !== "/" && pathname.startsWith(`/${locale}${item.href}`));

          return (
            <Link
              key={item.name}
              href={getHref(item.href)}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-violet-400 bg-violet-500/10"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={cn("h-5 w-5 mb-1", isActive && "text-violet-400")}
                aria-hidden="true"
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

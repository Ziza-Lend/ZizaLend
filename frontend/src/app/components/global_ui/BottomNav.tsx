"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, HandCoins, PiggyBank, Swords, Clock } from "lucide-react";
import { motion } from "framer-motion";
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
      <div className="relative flex items-center justify-around px-2 pb-1 pt-2">
        {/* Animated active indicator */}
        {navItems.map((item) => {
          const isActive =
            pathname === `/${locale}${item.href}` ||
            (item.href !== "/" && pathname.startsWith(`/${locale}${item.href}`));

          return (
            <Link
              key={item.name}
              href={getHref(item.href)}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-colors duration-150 active:scale-[0.92]",
                isActive
                  ? "text-violet-400"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -top-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-violet-500"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
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

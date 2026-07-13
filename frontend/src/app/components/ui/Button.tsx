"use client";

import * as React from "react";
import { cn } from "@/app/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Component = "button";

    const variants = {
      primary:
        "bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 shadow-[var(--shadow-glow)]",
      secondary:
        "bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] active:bg-[var(--bg-surface-elevated)]",
      outline:
        "border border-[var(--border-default)] bg-transparent hover:bg-[var(--bg-surface)] active:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]",
      ghost:
        "bg-transparent hover:bg-[var(--bg-surface)] active:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10 px-0",
    };

    return (
      <Component
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 ease-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
          variants[variant],
          sizes[size],
          className,
        )}
        ref={ref}
        aria-busy={isLoading || undefined}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && (
          <div role="status" className="mr-2 flex items-center">
            <svg
              className="h-4 w-4 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        )}
        {!isLoading && leftIcon && <span className="mr-2 -ml-1">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2 -mr-1">{rightIcon}</span>}
      </Component>
    );
  },
);

Button.displayName = "Button";

export { Button };

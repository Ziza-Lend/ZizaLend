"use client";

import * as React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useModalFocusTrap } from "../../hooks/useModalFocusTrap";

import { cn } from "@/app/utils/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  ariaLabel,
  children,
  className,
  size = "lg",
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();

  useModalFocusTrap({
    isOpen,
    onClose,
    containerRef: modalRef,
    initialFocusRef: closeButtonRef,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Content — Bottom sheet on mobile, centered dialog on desktop */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={!title ? ariaLabel : undefined}
            tabIndex={-1}
            className={cn(
              "relative w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-zinc-950 dark:border dark:border-zinc-800 focus:outline-none",
              "sm:w-auto sm:rounded-2xl sm:max-h-[90vh]",
              sizeClasses[size],
              className,
            )}
          >
            {/* Mobile drag handle — visual cue for bottom sheet */}
            <div className="flex justify-center pt-2 sm:hidden" aria-hidden="true">
              <div className="h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
              {title && (
                <h3 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                  {title}
                </h3>
              )}
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close modal"
                className="ml-auto rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900 dark:text-zinc-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-5 max-h-[70vh]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export { Modal };
export default Modal;
